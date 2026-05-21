package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalFreelancers() { return totalFreelancers; }
    public void setTotalFreelancers(long totalFreelancers) { this.totalFreelancers = totalFreelancers; }
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
    public long getTotalProjects() { return totalProjects; }
    public void setTotalProjects(long totalProjects) { this.totalProjects = totalProjects; }
    public long getActiveProjects() { return activeProjects; }
    public void setActiveProjects(long activeProjects) { this.activeProjects = activeProjects; }
    public long getCompletedContracts() { return completedContracts; }
    public void setCompletedContracts(long completedContracts) { this.completedContracts = completedContracts; }
    public BigDecimal getTotalGmv() { return totalGmv; }
    public void setTotalGmv(BigDecimal totalGmv) { this.totalGmv = totalGmv; }
    public double getMatchingRate() { return matchingRate; }
    public void setMatchingRate(double matchingRate) { this.matchingRate = matchingRate; }
    public Map<String, Long> getUserGrowthTrend() { return userGrowthTrend; }
    public void setUserGrowthTrend(Map<String, Long> userGrowthTrend) { this.userGrowthTrend = userGrowthTrend; }

    private long totalUsers;
    private long totalFreelancers;
    private long totalCustomers;
    private long totalProjects;
    private long activeProjects;
    private long completedContracts;
    private BigDecimal totalGmv; // Gross Merchandise Volume
    private double matchingRate; // % projects with contracts

    // User growth trend for charts (e.g., Last 7 days)
    private Map<String, Long> userGrowthTrend;
}
