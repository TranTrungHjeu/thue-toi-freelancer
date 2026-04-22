package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminBroadcastRequest {

    @Size(max = 50, message = "Vai trò đích không hợp lệ")
    private String targetRole;

    @Size(max = 50, message = "Loại thông báo không hợp lệ")
    private String type;

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    @Size(max = 255, message = "Tiêu đề thông báo quá dài")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    @Size(max = 2000, message = "Nội dung thông báo quá dài")
    private String content;

    @Size(max = 255, message = "Đường dẫn điều hướng quá dài")
    private String link;
}
