package com.thuetoi.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class AuthUserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String avatarUrl;
    private String profileDescription;
    private List<String> skills;
    private Boolean isActive;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AuthUserResponse() {
    }

    public AuthUserResponse(Long id, String email, String fullName, String role, String avatarUrl, String profileDescription, Boolean isActive, Boolean verified, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, email, fullName, role, avatarUrl, profileDescription, null, isActive, verified, createdAt, updatedAt);
    }

    public AuthUserResponse(Long id, String email, String fullName, String role, String avatarUrl, String profileDescription, List<String> skills, Boolean isActive, Boolean verified, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.profileDescription = profileDescription;
        this.skills = skills;
        this.isActive = isActive;
        this.verified = verified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public String getProfileDescription() {
        return profileDescription;
    }

    public void setProfileDescription(String profileDescription) {
        this.profileDescription = profileDescription;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
