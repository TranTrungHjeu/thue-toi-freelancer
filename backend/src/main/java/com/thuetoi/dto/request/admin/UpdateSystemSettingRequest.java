package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSystemSettingRequest {

    @NotBlank(message = "Khóa cấu hình không được để trống")
    @Size(max = 100, message = "Khóa cấu hình quá dài")
    private String key;

    @NotNull(message = "Giá trị cấu hình không được để trống")
    @Size(max = 4000, message = "Giá trị cấu hình quá dài")
    private String value;
}
