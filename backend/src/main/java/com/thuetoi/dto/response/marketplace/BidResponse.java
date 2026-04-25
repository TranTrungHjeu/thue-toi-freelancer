package com.thuetoi.dto.response.marketplace;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.thuetoi.dto.request.FileAttachmentRequest;

public record BidResponse(
    Long id,
    ProjectSummaryResponse project,
    UserSummaryResponse freelancer,
    BigDecimal price,
    String message,
    String estimatedTime,
    List<FileAttachmentRequest> attachments,
    String status,
    LocalDateTime createdAt
) {
}
