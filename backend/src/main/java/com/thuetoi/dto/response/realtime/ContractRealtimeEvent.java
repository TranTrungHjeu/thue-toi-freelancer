package com.thuetoi.dto.response.realtime;

public record ContractRealtimeEvent(
    String type,
    Long contractId,
    Object payload
) {
}
