package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * Entity WithdrawalRequest: Yêu cầu rút tiền từ Freelancer
 */
@Entity
@Table(name = "withdrawal_requests")
@Data
@EqualsAndHashCode(callSuper = false)
public class WithdrawalRequest extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "bank_info", nullable = false, length = 1000)
    private String bankInfo;

    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "processed_by")
    private Long processedBy;
}
