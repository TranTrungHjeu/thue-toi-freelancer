package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "payment_webhook_events")
@Data
@EqualsAndHashCode(callSuper = true)
public class PaymentWebhookEvent extends BaseEntity {

    @Column(name = "sepay_transaction_id", nullable = false, unique = true, length = 64)
    private String sepayTransactionId;

    @Column(name = "order_code", length = 64)
    private String orderCode;

    @Column(name = "reference_code", length = 255)
    private String referenceCode;

    @Column(name = "transfer_amount", precision = 19, scale = 2)
    private BigDecimal transferAmount;

    @Column(name = "transfer_type", length = 16)
    private String transferType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_payload_json", nullable = false, columnDefinition = "json")
    private Map<String, Object> rawPayloadJson;

    @Column(name = "payment_order_id")
    private Long paymentOrderId;
}
