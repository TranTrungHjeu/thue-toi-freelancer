package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO cập nhật trạng thái milestone.
 */
@Data
public class MilestoneStatusRequest {
    @NotBlank(message = "Trạng thái milestone không được để trống")
    private String status;
}
