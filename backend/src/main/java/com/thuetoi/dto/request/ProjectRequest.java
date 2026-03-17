package com.thuetoi.dto.request;

import lombok.Data;

import java.util.Date;

/**
 * DTO tạo/cập nhật dự án
 */
@Data
public class ProjectRequest {
    private Long userId;
    private String title;
    private String description;
    private Double budgetMin;
    private Double budgetMax;
    private Date deadline;
    private String status;
}
