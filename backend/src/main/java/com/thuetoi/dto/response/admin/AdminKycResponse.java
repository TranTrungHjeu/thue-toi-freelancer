package com.thuetoi.dto.response.admin;

import java.time.LocalDateTime;

public record AdminKycResponse(
    Long id,
    AdminUserSummaryResponse user,
    String status,
    String note,
    String idNumber,
    String fullName,
    String birthday,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
