package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportSubmitRequest {

    @NotBlank(message = "Loại đối tượng bị báo cáo không được để trống")
    @Size(max = 50, message = "Loại đối tượng bị báo cáo không hợp lệ")
    private String targetType;

    @NotNull(message = "Định danh đối tượng bị báo cáo không được để trống")
    private Long targetId;

    @NotBlank(message = "Lý do báo cáo không được để trống")
    @Size(max = 100, message = "Lý do báo cáo quá dài")
    private String reason;

    @Size(max = 2000, message = "Mô tả báo cáo quá dài")
    private String description;
}
