package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity WithdrawalRequest: Yêu cầu rút tiền của user.
 *
 * Luồng nghiệp vụ:
 *   PENDING   - User vừa tạo yêu cầu, balance đã bị HOLD (đã trừ khỏi ví)
 *   APPROVED  - Admin đã duyệt, sẵn sàng chuyển khoản thủ công ngoài đời
 *   COMPLETED - SePay webhook (transferType=out) nhận diện order_code -> tự đóng đơn
 *   REJECTED  - Admin từ chối, hệ thống tự refund balance lại cho user
 */
@Entity
@Table(name = "withdrawal_requests")
@Data
@EqualsAndHashCode(callSuper = true)
public class WithdrawalRequest extends BaseEntity {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    /** Backward-compat: snapshot tự do (vd: copy paste từ user) */
    @Column(name = "bank_info", length = 1000)
    private String bankInfo;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "bank_code", length = 32)
    private String bankCode;

    @Column(name = "account_number", length = 64)
    private String accountNumber;

    @Column(name = "account_holder", length = 200)
    private String accountHolder;

    @Column(name = "qr_image_url", length = 512)
    private String qrImageUrl;

    @Column(name = "bank_account_id")
    private Long bankAccountId;

    @Column(name = "order_code", length = 64, unique = true)
    private String orderCode;

    @Column(name = "status", nullable = false, length = 32)
    private String status = STATUS_PENDING;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "sepay_transaction_id", length = 64)
    private String sepayTransactionId;
}
