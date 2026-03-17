package com.thuetoi.entity;

import javax.persistence.*;
import java.util.Date;

/**
 * Entity Bid: Báo giá/đề xuất của freelancer cho dự án
 */
@Entity
@Table(name = "bids")
public class Bid extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    @Column(nullable = false)
    private Double price;

    private String message;
    private String estimatedTime;
    private String attachments;

    @Column(nullable = false)
    private String status; // pending, accepted, rejected, withdrawn

    // Getter, Setter, Constructor
}
