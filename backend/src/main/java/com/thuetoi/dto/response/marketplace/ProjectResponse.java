package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProjectResponse(
    Long id,
    UserSummaryResponse user,
    String title,
    String description,
    BigDecimal budgetMin,
    BigDecimal budgetMax,
    LocalDateTime deadline,
    String status,
    List<String> skills,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
