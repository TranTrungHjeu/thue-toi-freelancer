package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

/**
 * Metadata tệp đã được upload và gắn vào một nghiệp vụ marketplace.
 */
@Data
public class FileAttachmentRequest {
    @NotBlank(message = "Đường dẫn tệp không được để trống")
    private String url;

    @NotBlank(message = "Tên tệp không được để trống")
    private String name;

    @NotBlank(message = "Loại tệp không được để trống")
    private String contentType;

    @NotNull(message = "Kích thước tệp không được để trống")
    @PositiveOrZero(message = "Kích thước tệp không hợp lệ")
    private Long size;
}
