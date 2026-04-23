package com.thuetoi.dto.response.marketplace;

import java.util.List;

public record NotificationPageResponse(
    List<NotificationResponse> notifications,
    int page,
    int size,
    long totalElements,
    int totalPages,
    long totalNotifications,
    long unreadCount
) {
}
