package com.thuetoi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO tạo đánh giá sau khi hoàn thành hợp đồng.
 */
@Data
public class ReviewRequest {
    @NotNull(message = "Hợp đồng không được để trống")
    private Long contractId;

    @NotNull(message = "Điểm đánh giá không được để trống")
    @Min(value = 1, message = "Điểm đánh giá phải từ 1 đến 5")
    @Max(value = 5, message = "Điểm đánh giá phải từ 1 đến 5")
    private Integer rating;

    private String comment;
}
