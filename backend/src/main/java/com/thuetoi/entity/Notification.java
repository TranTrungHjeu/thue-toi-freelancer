package com.thuetoi.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
public class Notification extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    // ...getter, setter...
}
