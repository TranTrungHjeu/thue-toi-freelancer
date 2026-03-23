package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO cập nhật trạng thái bid.
 */
@Data
public class BidStatusRequest {
    @NotBlank(message = "Trạng thái bid không được để trống")
    private String status;
}
