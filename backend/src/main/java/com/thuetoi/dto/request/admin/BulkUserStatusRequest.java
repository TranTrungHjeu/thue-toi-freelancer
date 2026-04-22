package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class BulkUserStatusRequest {

    @NotEmpty(message = "Danh sách người dùng không được để trống")
    private List<Long> userIds;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean active;

    @Size(max = 500, message = "Lý do cập nhật quá dài")
    private String reason;
}
