package com.thuetoi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.util.Date;

/**
 * Entity User: Quản lý thông tin người dùng, freelancer, khách hàng
 * @author Thuê Tôi
 */
@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = false)
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

    // Getter, Setter, Constructor
}
