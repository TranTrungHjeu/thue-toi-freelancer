package com.thuetoi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Entity User: Quản lý thông tin người dùng, freelancer, khách hàng
 * @author Thuê Tôi
 */
@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = false, exclude = {"skills"})
public class User extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role; // freelancer, customer, admin

    private String avatarUrl;

    private String profileDescription;

    private Boolean isActive = true;

    private Boolean verified = false;

    @ManyToMany
    @JoinTable(
        name = "users_skills",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();

    @Column(precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    // Getter, Setter, Constructor
}
