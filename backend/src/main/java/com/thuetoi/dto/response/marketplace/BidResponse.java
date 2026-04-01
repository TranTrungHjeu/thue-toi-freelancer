package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BidResponse(
    Long id,
    ProjectSummaryResponse project,
    UserSummaryResponse freelancer,
    BigDecimal price,
    String message,
    String estimatedTime,
    String attachments,
    String status,
    LocalDateTime createdAt
) {
}
