package com.thuetoi.sepay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.config.SePayProperties;
import com.thuetoi.exception.BusinessException;
import org.springframework.http.*;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.beans.factory.annotation.Autowired;
import lombok.extern.slf4j.Slf4j;

/**
 * Gọi SePay User API v2: tạo / hủy / lấy đơn VA.
 * Rate limit: 3 req/s (theo tài liệu SePay v2).
 */
@Slf4j
@Component
public class SePayApiClient {

    private final SePayProperties props;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Autowired
    public SePayApiClient(SePayProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getConnectTimeoutMs());
        factory.setReadTimeout(props.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(new BufferingClientHttpRequestFactory(factory));
        this.restTemplate.getMessageConverters().add(new MappingJackson2HttpMessageConverter());
        this.restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory(props.getBaseUrl()));
    }

    public boolean isConfigured() {
        return !props.getApiToken().isBlank() && !props.getBankAccountXid().isBlank();
    }

    /**
     * POST /v2/bank-accounts/{ba}/orders
     */
    public JsonNode createOrder(String orderCode, long amountVnd) {
        ensureConfigured();
        String path = "/v2/bank-accounts/" + props.getBankAccountXid() + "/orders";
        Map<String, Object> body = new HashMap<>();
        if (!props.getVaPrefix().isBlank()) {
            body.put("va_prefix", props.getVaPrefix());
        }
        body.put("order_code", orderCode);
        body.put("amount", amountVnd);
        body.put("duration", props.getOrderDurationSeconds());
        body.put("with_qrcode", "1");
        body.put("qrcode_template", "compact");

        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                path,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
            );
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new BusinessException("ERR_PAYMENT_04", "SePay tạo đơn thất bại (HTTP " + res.getStatusCode() + ")", HttpStatus.BAD_GATEWAY);
            }
            return parseSuccessEnvelope(res.getBody());
        } catch (HttpStatusCodeException ex) {
            throw mapSePayError(ex);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("ERR_PAYMENT_04", "Lỗi kết nối SePay: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    /**
     * DELETE /v2/bank-accounts/{ba}/orders/{orderXid} — 204 nội dung rỗng
     */
    public void cancelOrder(String sepayOrderXid) {
        ensureConfigured();
        String path = "/v2/bank-accounts/" + props.getBankAccountXid() + "/orders/" + sepayOrderXid;
        try {
            restTemplate.exchange(path, HttpMethod.DELETE, new HttpEntity<>(null, authHeaders()), Void.class);
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return;
            }
            throw mapSePayError(ex);
        }
    }

    /**
     * Tra cứu giao dịch CHUYỂN RA gần đây trên SePay theo mã đơn (TTW...) và số tiền kỳ vọng.
     * <p>Dùng cho luồng admin xác nhận đã chuyển khoản rút tiền: chỉ cho phép đóng đơn rút
     * sau khi SePay xác nhận đã có giao dịch chuyển ra khớp mã đơn.</p>
     * <p>SePay v2 docs: <code>GET /v2/transactions?q=...&transfer_type=out</code>. Tham số
     * <code>q</code> tìm kiếm trên các trường reference_number, transaction_content, code.</p>
     *
     * @param orderCode      mã đơn rút tiền (vd: TTW123R45X9af2b1c0)
     * @param expectedAmount số tiền kỳ vọng (VND); nếu khác thì bỏ qua, tránh nhầm lẫn
     * @return JsonNode giao dịch nếu khớp, hoặc {@link Optional#empty()} nếu chưa thấy
     */
    public Optional<JsonNode> findOutgoingTransactionByOrderCode(String orderCode, BigDecimal expectedAmount) {
        ensureConfigured();
        if (orderCode == null || orderCode.isBlank()) {
            return Optional.empty();
        }

        // Sử dụng UriComponentsBuilder để escape giá trị query trước khi nối path.
        // DefaultUriBuilderFactory(base) sẽ tự prefix base URL.
        String path = UriComponentsBuilder.fromUriString("/v2/transactions")
            .queryParam("q", orderCode)
            .queryParam("transfer_type", "out")
            .queryParam("per_page", 50)
            .build()
            .toUriString();

        try {
            ResponseEntity<String> res = restTemplate.exchange(
                path, HttpMethod.GET, new HttpEntity<>(null, authHeaders()), String.class
            );
            if (res.getBody() == null) {
                return Optional.empty();
            }
            JsonNode root = objectMapper.readTree(res.getBody());
            if (!"success".equalsIgnoreCase(Optional.ofNullable(root.get("status")).map(JsonNode::asText).orElse(""))) {
                log.warn("[SePayApiClient] tra cứu transactions trả về status={} body={}",
                    Optional.ofNullable(root.get("status")).map(JsonNode::asText).orElse("?"),
                    res.getBody());
                return Optional.empty();
            }
            JsonNode data = root.get("data");
            if (data == null || !data.isArray()) {
                return Optional.empty();
            }

            String upperCode = orderCode.trim().toUpperCase(Locale.ROOT);
            BigDecimal expected = expectedAmount == null
                ? null
                : expectedAmount.setScale(0, RoundingMode.HALF_UP);

            for (JsonNode tx : data) {
                String content = upperOrEmpty(tx, "transaction_content");
                String code = upperOrEmpty(tx, "code");
                String ref = upperOrEmpty(tx, "reference_number");
                boolean matchCode = content.contains(upperCode)
                    || code.contains(upperCode)
                    || ref.contains(upperCode);
                if (!matchCode) {
                    continue;
                }

                if (expected != null) {
                    BigDecimal amountOut = bigDecimalOf(tx, "amount_out");
                    if (amountOut == null) {
                        continue;
                    }
                    if (amountOut.setScale(0, RoundingMode.HALF_UP).compareTo(expected) != 0) {
                        log.warn("[SePayApiClient] tx khớp code={} nhưng số tiền {} != kỳ vọng {} -> bỏ qua",
                            upperCode, amountOut, expected);
                        continue;
                    }
                }
                return Optional.of(tx);
            }
            return Optional.empty();
        } catch (HttpStatusCodeException ex) {
            throw mapSePayError(ex);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(
                "ERR_PAYMENT_04",
                "Lỗi tra cứu giao dịch trên SePay: " + e.getMessage(),
                HttpStatus.BAD_GATEWAY
            );
        }
    }

    private static String upperOrEmpty(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return "";
        }
        return v.asText("").toUpperCase(Locale.ROOT);
    }

    private static BigDecimal bigDecimalOf(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        try {
            String text = v.asText("0");
            if (text.isEmpty()) return BigDecimal.ZERO;
            return new BigDecimal(text);
        } catch (Exception e) {
            return null;
        }
    }

    public JsonNode getOrder(String sepayOrderXid) {
        ensureConfigured();
        String path = "/v2/bank-accounts/" + props.getBankAccountXid() + "/orders/" + sepayOrderXid;
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                path, HttpMethod.GET, new HttpEntity<>(null, authHeaders()), String.class
            );
            if (res.getBody() == null) {
                throw new BusinessException("ERR_PAYMENT_04", "SePay: không có nội dung phản hồi", HttpStatus.BAD_GATEWAY);
            }
            return parseSuccessEnvelope(res.getBody());
        } catch (HttpStatusCodeException ex) {
            throw mapSePayError(ex);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("ERR_PAYMENT_04", "Lỗi lấy trạng thái SePay: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private JsonNode parseSuccessEnvelope(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!"success".equalsIgnoreCase(Optional.ofNullable(root.get("status")).map(JsonNode::asText).orElse(""))) {
                String msg = Optional.ofNullable(root.get("message")).map(JsonNode::asText).orElse("SePay từ chối yêu cầu");
                throw new BusinessException("ERR_PAYMENT_04", msg, HttpStatus.BAD_REQUEST);
            }
            return root.get("data");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("ERR_PAYMENT_04", "Phản hồi SePay không hợp lệ", HttpStatus.BAD_GATEWAY);
        }
    }

    private BusinessException mapSePayError(HttpStatusCodeException ex) {
        // Log ở cấp warn vì đây là sự kiện SePay từ chối — luồng bị chặn bởi bên thứ ba, không phải lỗi hệ thống nội bộ
        log.warn("[SePayApiClient] Loi tu SePay — bankAccountXid='{}' baseUrl='{}' status={} body={}",
                props.getBankAccountXid(), props.getBaseUrl(),
                ex.getStatusCode(), ex.getResponseBodyAsString());
        if (ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
            return new BusinessException("ERR_PAYMENT_04", "SePay vượt rate limit, thử lại sau", HttpStatus.SERVICE_UNAVAILABLE);
        }
        String detail = ex.getResponseBodyAsString();
        if (detail != null && detail.length() > 200) {
            detail = detail.substring(0, 200);
        }
        return new BusinessException("ERR_PAYMENT_04", "SePay lỗi: " + ex.getStatusCode() + " " + detail, HttpStatus.BAD_GATEWAY);
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new BusinessException("ERR_PAYMENT_03", "Thiếu cấu hình SePay (token hoặc bank account id)", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private HttpHeaders authHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(props.getApiToken().trim());
        return h;
    }
}
