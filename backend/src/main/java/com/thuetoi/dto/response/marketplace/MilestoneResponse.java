package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MilestoneResponse(
    Long id,
    Long contractId,
    String title,
    BigDecimal amount,
    LocalDateTime dueDate,
    String status
) {
}
