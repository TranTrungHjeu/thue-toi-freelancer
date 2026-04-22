package com.thuetoi.dto.response.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminWithdrawalResponse(
    Long id,
    AdminUserSummaryResponse user,
    BigDecimal amount,
    String bankInfo,
    String status,
    String note,
    Long processedBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
