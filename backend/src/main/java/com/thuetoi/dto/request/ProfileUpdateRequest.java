package com.thuetoi.dto.request;

import lombok.Data;

import java.util.List;

/**
 * DTO cập nhật hồ sơ người dùng hiện tại.
 */
@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String profileDescription;
    private String avatarUrl;
    private List<String> skills;
}
