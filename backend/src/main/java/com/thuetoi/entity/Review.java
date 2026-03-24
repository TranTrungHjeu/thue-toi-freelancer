package com.thuetoi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "reviews")
@Data
@EqualsAndHashCode(callSuper = false)
public class Review extends BaseEntity {
    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment")
    private String comment;

    @Column(name = "reply")
    private String reply;
}
