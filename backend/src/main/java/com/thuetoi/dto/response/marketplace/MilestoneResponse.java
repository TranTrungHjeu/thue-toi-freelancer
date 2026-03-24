package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record MilestoneResponse(
    Long id,
    Long contractId,
    String title,
    Double amount,
    LocalDateTime dueDate,
    String status
) {
}
