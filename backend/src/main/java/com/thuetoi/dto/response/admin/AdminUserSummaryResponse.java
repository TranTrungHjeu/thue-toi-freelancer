package com.thuetoi.dto.response.admin;

public record AdminUserSummaryResponse(
    Long id,
    String fullName,
    String email,
    String role,
    String avatarUrl
) {
}
