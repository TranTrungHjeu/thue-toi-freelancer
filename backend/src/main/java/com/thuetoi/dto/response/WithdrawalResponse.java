package com.thuetoi.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WithdrawalResponse(
    Long id,
    BigDecimal amount,
    String status,
    String bankName,
    String bankCode,
    String accountNumber,
    String accountHolder,
    String qrImageUrl,
    String orderCode,
    String note,
    LocalDateTime createdAt,
    LocalDateTime approvedAt,
    LocalDateTime completedAt
) {
}
