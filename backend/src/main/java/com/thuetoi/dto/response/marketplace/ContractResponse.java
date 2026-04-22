package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContractResponse(
    Long id,
    Long projectId,
    Long freelancerId,
    Long customerId,
    BigDecimal totalAmount,
    Integer progress,
    String status,
    LocalDateTime startDate,
    LocalDateTime endDate
) {
}
