package com.thuetoi.dto.request;

import lombok.Data;

/**
 * DTO gửi/cập nhật báo giá
 */
@Data
public class BidRequest {
    private Long projectId;
    private Long freelancerId;
    private Double price;
    private String message;
    private String estimatedTime;
    private String attachments;
    private String status;
}
