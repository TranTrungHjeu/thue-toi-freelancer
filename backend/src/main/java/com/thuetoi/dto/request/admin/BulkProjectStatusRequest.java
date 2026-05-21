package com.thuetoi.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkProjectStatusRequest {
    public List<Long> getProjectIds() { return projectIds; }
    public void setProjectIds(List<Long> projectIds) { this.projectIds = projectIds; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }


    @NotEmpty(message = "Danh sách dự án không được để trống")
    private List<Long> projectIds;

    @NotBlank(message = "Trạng thái dự án không được để trống")
    private String status;
}
