package com.thuetoi.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
    private BigDecimal budgetMin;

    @NotNull(message = "Ngân sách tối đa không được để trống")
    @DecimalMin(value = "0.0", message = "Ngân sách tối đa không được âm")
    private BigDecimal budgetMax;

    private LocalDateTime deadline;
    private String status;
    private List<String> skills;
    private List<FileAttachmentRequest> attachments;
}
