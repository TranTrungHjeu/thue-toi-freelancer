package com.thuetoi.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletLedgerLineResponse(
    String entryType,
    BigDecimal amount,
    String description,
    Long contractId,
    LocalDateTime createdAt
) {
}
