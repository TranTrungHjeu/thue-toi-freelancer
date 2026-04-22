package com.thuetoi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Entity AuditLog: Ghi lại nhật ký các hành động nhạy cảm hoặc quan trọng của Admin
 * Bám chuẩn chuyên nghiệp: truy vết IP, Admin, Hành động, Đối tượng và Chi tiết.
 */
@Entity
@Table(name = "audit_logs")
@Data
@EqualsAndHashCode(callSuper = true)
public class AuditLog extends BaseEntity {

    @Column(nullable = false)
    private String adminEmail;

    @Column(nullable = false)
    private String action; // Ví dụ: LOCK_USER, APPROVE_PROJECT, UPDATE_SETTING

    @Column(nullable = false)
    private String entityType; // Ví dụ: USER, PROJECT, SETTING

    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String detail; // Chi tiết cụ thể của hành động (lý do, giá trị cũ/mới)

    private String ipAddress;
}
