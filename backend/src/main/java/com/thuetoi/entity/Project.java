package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.Date;

/**
 * Entity Project: Quản lý dự án/việc làm
 */
@Entity
@Table(name = "projects")
@Data
@EqualsAndHashCode(callSuper = false)
public class Project extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    private String description;

    private Double budgetMin;
    private Double budgetMax;

    private Date deadline;

    @Column(nullable = false)
    private String status; // open, in_progress, completed, cancelled

    // Getter, Setter, Constructor
}
