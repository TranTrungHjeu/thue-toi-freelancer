package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

/**
 * Metadata tệp đã được upload và gắn vào một nghiệp vụ marketplace.
 */
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

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }
}
