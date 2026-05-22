package com.thuetoi.dto.response.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminWithdrawalResponse(
    Long id,
    AdminUserSummaryResponse user,
    BigDecimal amount,
    String bankInfo,
    String bankName,
    String bankCode,
    String accountNumber,
    String accountHolder,
    String qrImageUrl,
    String orderCode,
    String status,
    String note,
    Long processedBy,
    LocalDateTime approvedAt,
    LocalDateTime completedAt,
    String sepayTransactionId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
