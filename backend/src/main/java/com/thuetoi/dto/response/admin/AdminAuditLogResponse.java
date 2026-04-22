package com.thuetoi.dto.response.admin;

import java.time.LocalDateTime;

public record AdminAuditLogResponse(
    Long id,
    String adminEmail,
    String action,
    String entityType,
    Long entityId,
    String detail,
    String ipAddress,
    LocalDateTime createdAt
) {
}
