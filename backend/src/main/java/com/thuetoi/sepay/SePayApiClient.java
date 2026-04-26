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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.util.DefaultUriBuilderFactory;

import org.springframework.beans.factory.annotation.Autowired;

/**
 * Gọi SePay User API v2: tạo / hủy / lấy đơn VA.
 * Rate limit: 3 req/s (theo tài liệu SePay v2).
 */
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
        System.out.println("[SePayApiClient] ERROR — bankAccountXid='" + props.getBankAccountXid()
                + "' baseUrl='" + props.getBaseUrl()
                + "' status=" + ex.getStatusCode()
                + " body=" + ex.getResponseBodyAsString());
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
