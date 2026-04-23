package com.thuetoi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "notification_preferences",
    uniqueConstraints = @UniqueConstraint(name = "uq_notification_preferences_user_type", columnNames = {"user_id", "type"})
)
@Data
public class NotificationPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "in_app_enabled", nullable = false)
    private Boolean inAppEnabled;

    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled;

    @Column(name = "browser_enabled", nullable = false)
    private Boolean browserEnabled;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (inAppEnabled == null) {
            inAppEnabled = true;
        }
        if (emailEnabled == null) {
            emailEnabled = false;
        }
        if (browserEnabled == null) {
            browserEnabled = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
