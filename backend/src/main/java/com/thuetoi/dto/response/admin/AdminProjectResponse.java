package com.thuetoi.dto.response.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminProjectResponse(
    Long id,
    AdminUserSummaryResponse user,
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
