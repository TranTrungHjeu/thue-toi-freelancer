package com.thuetoi.service;

import com.thuetoi.config.SePayProperties;
import com.thuetoi.entity.PaymentOrder;
import com.thuetoi.entity.PaymentWebhookEvent;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.PaymentOrderRepository;
import com.thuetoi.repository.PaymentWebhookEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Webhook giao dịch SePay — trường {@code code} khớp {@code order_code} đơn VA (tài liệu SePay v2).
 */
@Slf4j
@Service
public class SePayWebhookService {

    @Autowired
    private SePayProperties sePayProperties;

    @Autowired
    private PaymentWebhookEventRepository paymentWebhookEventRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private PaymentService paymentService;

    public void requireValidAuth(String authorizationHeader) {
        String key = Optional.ofNullable(sePayProperties.getWebhookApiKey()).orElse("").trim();
        if (key.isEmpty()) {
            throw new BusinessException("ERR_PAYMENT_04", "Chưa cấu hình sepay.webhook-api-key", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new BusinessException("ERR_PAYMENT_04", "Thiếu tiêu đề Authorization", HttpStatus.UNAUTHORIZED);
        }
        String t = authorizationHeader.trim();
        boolean ok = t.equals("Apikey " + key) || t.equals("Bearer " + key);
        if (!ok) {
            throw new BusinessException("ERR_PAYMENT_04", "Xác thực webhook SePay thất bại", HttpStatus.UNAUTHORIZED);
        }
    }

    @Transactional
    public void processIncomingTransaction(Map<String, Object> body) {
        String txId = extractTransactionId(body);
        String transferType = asString(body.get("transferType"));
        BigDecimal amount = toAmount(body.get("transferAmount"));
        log.info("[SePayWebhook] received txId={} transferType={} amount={} code={} referenceCode={} content={}",
            txId, transferType, amount, body.get("code"), body.get("referenceCode"), body.get("content"));
        if (paymentWebhookEventRepository.existsBySepayTransactionId(txId)) {
            log.info("[SePayWebhook] duplicate txId={}, skip", txId);
            return;
        }
        if (transferType != null && !"in".equalsIgnoreCase(transferType)) {
            persistEvent(txId, null, null, null, null, body);
            return;
        }
        String code = asString(body.get("code"));
        if (code == null || code.isBlank()) {
            // SePay only fills `code` when a dashboard pattern matches the memo.
            // Fall back to scanning the raw memo for our deterministic order code
            // formats produced by PaymentService:
            // TTB<bidId>P<projectId>X<8 hex> for checkout, TTD<userId>W<8 hex> for wallet deposits.
            code = extractOrderCodeFromMemo(body);
        }
        if (code == null || code.isBlank()) {
            tryPersistEvent(txId, null, null, null, null, body);
            return;
        }
        code = code.trim();
        Optional<PaymentOrder> orderOpt = paymentOrderRepository.findDetailedByOrderCode(code);
        if (orderOpt.isEmpty()) {
            tryPersistEvent(txId, code, null, amount, transferType, body);
            return;
        }
        PaymentOrder order = orderOpt.get();
        if (amount != null && order.getAmount() != null) {
            int cmp = order.getAmount().setScale(0, RoundingMode.HALF_UP)
                .compareTo(amount.setScale(0, RoundingMode.HALF_UP));
            if (cmp != 0) {
                tryPersistEvent(txId, code, order.getId(), amount, transferType, body);
                return;
            }
        }
        if (!PaymentService.ST_PENDING.equals(order.getStatus()) && !PaymentService.ST_PAID.equals(order.getStatus())) {
            tryPersistEvent(txId, code, order.getId(), amount, transferType, body);
            return;
        }
        if (PaymentService.ST_PENDING.equals(order.getStatus())) {
            paymentService.afterPaymentReceived(order);
        } else if (PaymentService.ST_PAID.equals(order.getStatus())) {
            paymentService.afterPaymentReceived(order);
        }
        try {
            tryPersistEvent(txId, code, order.getId(), amount, transferType, body);
        } catch (DataIntegrityViolationException e) {
            // trùng id giao dịch — coi như thành công
        }
    }

    private void tryPersistEvent(
        String txId, String orderCode, Long paymentOrderId, BigDecimal transferAmount,
        String transferType, Map<String, Object> raw
    ) {
        try {
            persistEvent(txId, orderCode, paymentOrderId, transferAmount, transferType, raw);
        } catch (DataIntegrityViolationException ignored) {
            // giao dịch trùng, idempotent
        }
    }

    private void persistEvent(
        String sepayTransactionId, String orderCode, Long paymentOrderId,
        BigDecimal transferAmount, String transferType, Map<String, Object> raw
    ) {
        PaymentWebhookEvent e = new PaymentWebhookEvent();
        e.setSepayTransactionId(sepayTransactionId);
        e.setOrderCode(orderCode);
        e.setReferenceCode(asString(raw.get("referenceCode")));
        e.setTransferAmount(transferAmount);
        e.setTransferType(transferType);
        e.setRawPayloadJson(new HashMap<>(raw));
        e.setPaymentOrderId(paymentOrderId);
        paymentWebhookEventRepository.save(e);
    }

    private static String extractTransactionId(Map<String, Object> body) {
        Object id = body.get("id");
        if (id != null) {
            if (id instanceof Number n) {
                return String.valueOf(n.longValue());
            }
            String textId = id.toString().trim();
            if (!textId.isEmpty()) {
                return textId;
            }
        }
        String rawKey = String.join("|",
            Optional.ofNullable(asString(body.get("referenceCode"))).orElse(""),
            Optional.ofNullable(asString(body.get("transactionDate"))).orElse(""),
            Optional.ofNullable(asString(body.get("accountNumber"))).orElse(""),
            Optional.ofNullable(asString(body.get("transferType"))).orElse(""),
            Optional.ofNullable(asString(body.get("transferAmount"))).orElse(""),
            Optional.ofNullable(asString(body.get("content"))).orElse("")
        );
        return "fallback-" + UUID.nameUUIDFromBytes(rawKey.getBytes(StandardCharsets.UTF_8));
    }

    private static String asString(Object o) {
        return o == null ? null : o.toString();
    }

    private static final Pattern ORDER_CODE_PATTERN =
        Pattern.compile("(?:TTB\\d+P\\d+X|TTD\\d+W)[0-9A-Fa-f]{8}");

    private static String extractOrderCodeFromMemo(Map<String, Object> body) {
        String[] fields = { "content", "description", "transferContent", "memo", "remark", "note" };
        for (String f : fields) {
            String v = asString(body.get(f));
            if (v == null || v.isBlank()) continue;
            Matcher m = ORDER_CODE_PATTERN.matcher(v);
            if (m.find()) {
                return m.group().toUpperCase(Locale.ROOT);
            }
        }
        return null;
    }

    private static BigDecimal toAmount(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof BigDecimal b) {
            return b;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(o.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
