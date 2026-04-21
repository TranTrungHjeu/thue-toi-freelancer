package com.thuetoi.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeEmailRequest {
    @NotBlank(message = "Mật khẩu không được để trống")
    private String oldPassword;

    @NotBlank(message = "Email mới không được để trống")
    @Email(message = "Email mới không đúng định dạng")
    private String newEmail;
    
    @NotBlank(message = "Mã OTP không được để trống")
    private String otp;
}
