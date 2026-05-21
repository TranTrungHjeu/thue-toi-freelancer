package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminResponse {
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getProfileDescription() { return profileDescription; }
    public void setProfileDescription(String profileDescription) { this.profileDescription = profileDescription; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Set<String> getSkills() { return skills; }
    public void setSkills(Set<String> skills) { this.skills = skills; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public long getProjectCount() { return projectCount; }
    public void setProjectCount(long projectCount) { this.projectCount = projectCount; }
    public long getBidCount() { return bidCount; }
    public void setBidCount(long bidCount) { this.bidCount = bidCount; }
    public long getContractCount() { return contractCount; }
    public void setContractCount(long contractCount) { this.contractCount = contractCount; }

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
    private BigDecimal balance;

    // Summary stats for this user
    private long projectCount; // As customer
    private long bidCount; // As freelancer
    private long contractCount; // Total contracts
}
