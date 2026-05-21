package com.thuetoi.dto.response;

import java.time.LocalDateTime;

public record BankAccountResponse(
    Long id,
    String bankName,
    String bankCode,
    String accountNumber,
    String accountHolder,
    String qrImageUrl,
    Boolean isDefault,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
