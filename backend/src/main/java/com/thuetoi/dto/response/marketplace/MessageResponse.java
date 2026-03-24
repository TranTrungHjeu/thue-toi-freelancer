package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    Long contractId,
    Long senderId,
    String messageType,
    String content,
    String attachments,
    LocalDateTime sentAt
) {
}
