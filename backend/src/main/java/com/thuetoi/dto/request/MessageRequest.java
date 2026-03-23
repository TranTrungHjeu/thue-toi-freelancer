package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO gửi tin nhắn trong hợp đồng.
 */
@Data
public class MessageRequest {
    @NotNull(message = "Hợp đồng không được để trống")
    private Long contractId;

    private String messageType;
    private String content;
    private String attachments;
}
