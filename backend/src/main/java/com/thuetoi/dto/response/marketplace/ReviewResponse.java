package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record ReviewResponse(
    Long id,
    Long contractId,
    Long reviewerId,
    Integer rating,
    String comment,
    String reply,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
