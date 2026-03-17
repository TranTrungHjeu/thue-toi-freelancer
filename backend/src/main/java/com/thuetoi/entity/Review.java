package com.thuetoi.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review")
public class Review extends BaseEntity {
    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment")
    private String comment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ...getter, setter...
}
