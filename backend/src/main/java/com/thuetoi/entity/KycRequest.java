package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Entity KycRequest: Theo dõi yêu cầu xác thực người dùng
 */
@Entity
@Table(name = "kyc_requests")
@Data
@EqualsAndHashCode(callSuper = false)
public class KycRequest extends BaseEntity {
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String note;
}
