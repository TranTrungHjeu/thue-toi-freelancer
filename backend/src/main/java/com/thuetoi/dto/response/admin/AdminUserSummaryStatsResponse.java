package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummaryStatsResponse {
    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
    public long getLockedUsers() { return lockedUsers; }
    public void setLockedUsers(long lockedUsers) { this.lockedUsers = lockedUsers; }
    public long getVerifiedUsers() { return verifiedUsers; }
    public void setVerifiedUsers(long verifiedUsers) { this.verifiedUsers = verifiedUsers; }
    public long getCustomerUsers() { return customerUsers; }
    public void setCustomerUsers(long customerUsers) { this.customerUsers = customerUsers; }
    public long getFreelancerUsers() { return freelancerUsers; }
    public void setFreelancerUsers(long freelancerUsers) { this.freelancerUsers = freelancerUsers; }
    public long getAdminUsers() { return adminUsers; }
    public void setAdminUsers(long adminUsers) { this.adminUsers = adminUsers; }

    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private long verifiedUsers;
    private long customerUsers;
    private long freelancerUsers;
    private long adminUsers;
}
