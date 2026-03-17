package com.thuetoi.dto.request;

import lombok.Data;

/**
 * DTO Đăng nhập user
 */
@Data
public class LoginRequest {
    private String email;
    private String password;
}
