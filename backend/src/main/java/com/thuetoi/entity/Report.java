package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Entity Report: Lưu trữ báo cáo vi phạm từ người dùng
 */
@Entity
@Table(name = "app_reports")
@Data
@EqualsAndHashCode(callSuper = false)
public class Report extends BaseEntity {
    @Column(nullable = false)
    private Long reporterId;

    @Column(nullable = false)
    private String targetType; // PROJECT, USER

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status; // PENDING, RESOLVED, DISMISSED
}
