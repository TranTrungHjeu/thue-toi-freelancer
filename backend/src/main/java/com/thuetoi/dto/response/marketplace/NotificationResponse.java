package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record NotificationResponse(
    Long id,
    Long userId,
    String type,
    String title,
    String content,
    String link,
    Boolean isRead,
    LocalDateTime createdAt
) {
}
