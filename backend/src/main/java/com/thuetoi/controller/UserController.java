package com.thuetoi.controller;

import com.thuetoi.dto.request.RegisterRequest;
import com.thuetoi.dto.request.LoginRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.User;
import com.thuetoi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Controller User: API đăng ký, đăng nhập, lấy thông tin user
 */
@RestController
@RequestMapping("/api/v1/auth")
public class UserController {
    @Autowired
    private UserService userService;

    /**
     * Đăng ký tài khoản
     */
    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request.getEmail(), request.getPassword(), request.getFullName(), request.getRole());
        return ApiResponse.success("Đăng ký thành công", user);
    }

    /**
     * Đăng nhập
     */
    @PostMapping("/login")
    public ApiResponse<User> login(@RequestBody LoginRequest request) {
        User user = userService.login(request.getEmail(), request.getPassword());
        return ApiResponse.success("Đăng nhập thành công", user);
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
