package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record BidResponse(
    Long id,
    ProjectSummaryResponse project,
    UserSummaryResponse freelancer,
    Double price,
    String message,
    String estimatedTime,
    String attachments,
    String status,
    LocalDateTime createdAt
) {
}
