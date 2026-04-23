package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
    Long id,
    Long contractId,
    BigDecimal amount,
    String method,
    String status,
    LocalDateTime createdAt
) {
}
