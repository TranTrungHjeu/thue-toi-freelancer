package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;
import java.util.Date;

public record ProjectResponse(
    Long id,
    UserSummaryResponse user,
    String title,
    String description,
    Double budgetMin,
    Double budgetMax,
    Date deadline,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
