package com.thuetoi.dto.response;

import java.time.LocalDateTime;

public record OtpVerificationStatusResponse(
    LocalDateTime expiresAt,
    LocalDateTime resendAvailableAt,
    long expiresInSeconds,
    long resendCooldownSeconds
) {
}
