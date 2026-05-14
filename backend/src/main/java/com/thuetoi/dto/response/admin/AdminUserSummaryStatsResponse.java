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
    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private long verifiedUsers;
    private long customerUsers;
    private long freelancerUsers;
    private long adminUsers;
}
