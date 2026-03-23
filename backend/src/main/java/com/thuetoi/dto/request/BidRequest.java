package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO gửi/cập nhật báo giá
 */
@Data
public class BidRequest {
    @NotNull(message = "Dự án không được để trống")
    private Long projectId;

    @NotNull(message = "Giá đề xuất không được để trống")
    @Positive(message = "Giá đề xuất phải lớn hơn 0")
    private Double price;

    private String message;
    private String estimatedTime;
    private String attachments;
}
