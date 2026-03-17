package com.thuetoi.controller;


import com.thuetoi.dto.request.RegisterRequest;
import com.thuetoi.dto.request.LoginRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.User;
import com.thuetoi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * Controller User: API đăng ký, đăng nhập, lấy thông tin user
 */
@RestController
@RequestMapping("/api/auth")
public class UserController {
        /**
         * Lấy thông tin user hiện tại từ session (Spring Security)
         */
        @GetMapping("/profile")
        public ApiResponse<User> getCurrentUser(java.security.Principal principal) {
            if (principal == null) {
                return ApiResponse.error("Chưa đăng nhập");
            }
            String email = principal.getName();
            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ApiResponse.error("Không tìm thấy user");
            }
            return ApiResponse.success("Lấy thông tin user hiện tại", user);
        }
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
    public ApiResponse<User> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        User user = userService.login(request.getEmail(), request.getPassword());
        // Tạo Authentication và lưu vào SecurityContext để session nhận diện đã đăng nhập
        org.springframework.security.core.Authentication authentication =
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user.getEmail(), null, java.util.Collections.emptyList()
            );
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
        // Gắn SecurityContext vào session
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", org.springframework.security.core.context.SecurityContextHolder.getContext());
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
