package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String avatarUrl;
    private String profileDescription;
    private Boolean isActive;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<String> skills;
    
    // Summary stats for this user
    private long projectCount; // As customer
    private long bidCount; // As freelancer
    private long contractCount; // Total contracts
}
