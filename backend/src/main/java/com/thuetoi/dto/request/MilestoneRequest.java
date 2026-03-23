package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO tạo milestone cho hợp đồng.
 */
@Data
public class MilestoneRequest {
    @NotBlank(message = "Tiêu đề milestone không được để trống")
    private String title;

    @NotNull(message = "Giá trị milestone không được để trống")
    @Positive(message = "Giá trị milestone phải lớn hơn 0")
    private Double amount;

    private LocalDateTime dueDate;
    private String status;
}
