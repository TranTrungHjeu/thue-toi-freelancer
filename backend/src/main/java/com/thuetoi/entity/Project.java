package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entity Project: Quản lý dự án/việc làm
 */
@Entity
@Table(name = "projects")
@Data
@EqualsAndHashCode(callSuper = false, exclude = {"user", "skills"})
public class Project extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    private String description;

    private BigDecimal budgetMin;
    private BigDecimal budgetMax;

    private LocalDateTime deadline;

    @Column(columnDefinition = "TEXT")
    private String attachments;

    @Column(nullable = false)
    private String status; // open, in_progress, completed, cancelled

    @ManyToMany
    @JoinTable(
        name = "projects_skills",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();

    // Getter, Setter, Constructor
}
