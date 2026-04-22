package com.thuetoi.dto.response.admin;

import java.time.LocalDateTime;

public record AdminReportResponse(
    Long id,
    AdminUserSummaryResponse reporter,
    String targetType,
    Long targetId,
    String reason,
    String description,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
