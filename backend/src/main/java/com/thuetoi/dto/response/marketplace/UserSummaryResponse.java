package com.thuetoi.dto.response.marketplace;

public record UserSummaryResponse(
    Long id,
    String fullName,
    String role,
    String avatarUrl
) {
}
