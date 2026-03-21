package com.thuetoi.controller;


import com.thuetoi.dto.request.RegisterRequest;
import com.thuetoi.dto.request.LoginRequest;
import com.thuetoi.dto.request.RefreshTokenRequest;
import com.thuetoi.dto.request.ResendVerificationRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.AuthTokenResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.entity.User;
import com.thuetoi.service.AuthService;
import com.thuetoi.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller User: API đăng ký, đăng nhập, lấy thông tin user
 */
@RestController
@RequestMapping("/api/v1/auths")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    /**
     * Lấy thông tin user hiện tại từ access token.
     */
    @GetMapping("/current-user")
    public ApiResponse<AuthUserResponse> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ApiResponse.error("Chưa đăng nhập");
        }
        AuthUserResponse user = userService.getAuthProfile(principal.getName());
        return ApiResponse.success("Lấy thông tin user hiện tại", user);
    }

    /**
     * Đăng ký tài khoản
     */
    @PostMapping("/sign-up")
    public ApiResponse<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthUserResponse user = userService.register(
            request.getEmail(),
            request.getPassword(),
            request.getFullName(),
            request.getRole(),
            request.getProfileDescription()
        );
        return ApiResponse.success("Đăng ký thành công", user);
    }

    /**
     * Đăng nhập
     */
    @PostMapping("/sign-in")
    public ApiResponse<AuthTokenResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthTokenResponse tokenResponse = authService.login(request.getEmail(), request.getPassword());
        return ApiResponse.success("Đăng nhập thành công", tokenResponse);
    }

    /**
     * Làm mới access token bằng refresh token.
     */
    @PostMapping("/refresh-token")
    public ApiResponse<AuthTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthTokenResponse tokenResponse = authService.refresh(request.getRefreshToken());
        return ApiResponse.success("Làm mới token thành công", tokenResponse);
    }

    /**
     * Đăng xuất: thu hồi toàn bộ refresh token còn hiệu lực của user hiện tại.
     */
    @PostMapping("/sign-out")
    public ApiResponse<Void> logout(Principal principal) {
        if (principal != null) {
            authService.logout(principal.getName());
        }
        return ApiResponse.success("Đăng xuất thành công", null);
    }

    /**
     * Lấy thông tin user
     */
    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        return userService.getUser(id)
                .map(user -> ApiResponse.success("Lấy thông tin thành công", user))
                .orElseGet(() -> ApiResponse.error("Không tìm thấy user"));
    }
}
