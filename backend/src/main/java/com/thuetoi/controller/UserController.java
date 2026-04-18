package com.thuetoi.controller;

import com.thuetoi.dto.request.ProfileUpdateRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller User: API lấy thông tin user phục vụ các màn hình quản trị và tra cứu.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    /**
     * Lấy thông tin user theo id.
     */
    @GetMapping("/{id}")
    public ApiResponse<AuthUserResponse> getUser(@PathVariable Long id) {
        AuthUserResponse user = userService.getUser(id)
            .map(userEntity -> userService.toAuthUserResponse(userEntity))
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
        return ApiResponse.success("Lấy thông tin thành công", user);
    }

    @PutMapping("/me/profile")
    public ApiResponse<AuthUserResponse> updateMyProfile(@RequestBody ProfileUpdateRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        AuthUserResponse updatedUser = userService.updateProfile(
            currentUserId,
            request.getFullName(),
            request.getProfileDescription(),
            request.getAvatarUrl(),
            request.getSkills()
        );
        return ApiResponse.success("Cập nhật hồ sơ thành công", updatedUser);
    }
}
