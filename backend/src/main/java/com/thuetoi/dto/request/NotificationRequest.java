package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO tạo thông báo cho user hiện tại.
 */
@Data
public class NotificationRequest {
    private String type;

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    private String content;
    private String link;
}
