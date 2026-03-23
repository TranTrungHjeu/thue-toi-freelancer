package com.thuetoi.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Date;

/**
 * DTO tạo/cập nhật dự án
 */
@Data
public class ProjectRequest {
    @NotBlank(message = "Tiêu đề dự án không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Ngân sách tối thiểu không được để trống")
    @DecimalMin(value = "0.0", message = "Ngân sách tối thiểu không được âm")
    private Double budgetMin;

    @NotNull(message = "Ngân sách tối đa không được để trống")
    @DecimalMin(value = "0.0", message = "Ngân sách tối đa không được âm")
    private Double budgetMax;

    private Date deadline;
    private String status;
}
