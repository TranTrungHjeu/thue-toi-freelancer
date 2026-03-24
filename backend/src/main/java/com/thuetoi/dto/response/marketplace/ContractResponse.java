package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record ContractResponse(
    Long id,
    Long projectId,
    Long freelancerId,
    Long customerId,
    Long clientId,
    Double totalAmount,
    Integer progress,
    String status,
    LocalDateTime startDate,
    LocalDateTime endDate
) {
}
