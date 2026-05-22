package com.thuetoi.dto.response.marketplace;

import java.time.LocalDateTime;
import java.util.List;
import com.thuetoi.dto.request.FileAttachmentRequest;

public record MessageResponse(
    Long id,
    Long contractId,
    Long senderId,
    Long recipientId,
    String messageType,
    String content,
    List<FileAttachmentRequest> attachments,
    LocalDateTime sentAt,
    String senderRole
) {
}
