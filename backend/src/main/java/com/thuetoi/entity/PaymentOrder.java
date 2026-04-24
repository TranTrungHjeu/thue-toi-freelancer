package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thanh toán qua SePay (VA order v2) gắn với bid được chọn.
 */
@Entity
@Table(name = "payment_orders")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"bid", "customer"})
public class PaymentOrder extends BaseEntity {

    @Column(name = "order_code", nullable = false, unique = true, length = 64)
    private String orderCode;

    @Column(nullable = false, length = 32)
    private String provider = "sepay";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bid_id", nullable = false)
    private Bid bid;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "sepay_order_xid", length = 64)
    private String sepayOrderXid;

    @Column(name = "va_number", length = 128)
    private String vaNumber;

    @Column(name = "va_holder_name")
    private String vaHolderName;

    @Column(name = "bank_name", length = 128)
    private String bankName;

    @Column(name = "account_number", length = 128)
    private String accountNumber;

    @Column(name = "qr_code", columnDefinition = "MEDIUMTEXT")
    private String qrCode;

    @Column(name = "qr_code_url", length = 1024)
    private String qrCodeUrl;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
