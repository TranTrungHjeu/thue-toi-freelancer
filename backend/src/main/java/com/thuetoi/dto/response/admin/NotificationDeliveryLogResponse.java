package com.thuetoi.dto.response.admin;

import java.time.LocalDateTime;

public record NotificationDeliveryLogResponse(
    Long id,
    Long notificationId,
    Long userId,
    String channel,
    String status,
    String detail,
    LocalDateTime createdAt
) {
}
