package com.thuetoi.dto.response.marketplace;

public record MessageRealtimeEvent(
    String event,
    Long contractId,
    MessageResponse data
) {
}
