package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkProjectStatusRequest {

    @NotEmpty(message = "Danh sách dự án không được để trống")
    private List<Long> projectIds;

    @NotBlank(message = "Trạng thái dự án không được để trống")
    private String status;
}
