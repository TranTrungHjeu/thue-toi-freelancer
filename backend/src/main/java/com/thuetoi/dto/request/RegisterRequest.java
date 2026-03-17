package com.thuetoi.dto.request;

import lombok.Data;

/**
 * DTO Đăng ký user
 */
@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String role;
}
