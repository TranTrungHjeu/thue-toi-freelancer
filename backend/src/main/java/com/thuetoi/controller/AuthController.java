package com.thuetoi.controller;

import com.thuetoi.dto.request.OtpRequest;
import com.thuetoi.dto.request.VerifyOtpRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private OtpService otpService;

    @PostMapping("/send-otp")
    public ApiResponse<Void> sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request.getEmail());
        return ApiResponse.success("OTP has been sent to your email.", null);
    }

    @PostMapping("/verify-otp")
    public ApiResponse<Void> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ApiResponse.success("OTP verified successfully. Your account is now active.", null);
    }
}
