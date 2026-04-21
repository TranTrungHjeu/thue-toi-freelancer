package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalFreelancers;
    private long totalCustomers;
    private long totalProjects;
    private long activeProjects;
    private long completedContracts;
    private double totalGmv; // Gross Merchandise Volume
    private double matchingRate; // % projects with contracts
    
    // User growth trend for charts (e.g., Last 7 days)
    private Map<String, Long> userGrowthTrend;
}
