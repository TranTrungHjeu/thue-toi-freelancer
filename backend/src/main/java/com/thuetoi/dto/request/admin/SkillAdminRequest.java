package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SkillAdminRequest {

    @NotBlank(message = "Tên kỹ năng không được để trống")
    @Size(max = 100, message = "Tên kỹ năng quá dài")
    private String name;

    @Size(max = 2000, message = "Mô tả kỹ năng quá dài")
    private String description;
}
