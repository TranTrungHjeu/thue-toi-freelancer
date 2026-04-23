package com.thuetoi.dto.response.marketplace;

public record NotificationPreferenceResponse(
    String type,
    boolean inAppEnabled,
    boolean emailEnabled,
    boolean browserEnabled
) {
}
