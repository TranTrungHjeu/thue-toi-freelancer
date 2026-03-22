package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.AuthUserResponse;
import com.thuetoi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Controller User: API lấy thông tin user phục vụ các màn hình quản trị và tra cứu.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Lấy thông tin user theo id.
     */
    @GetMapping("/{id}")
    public ApiResponse<AuthUserResponse> getUser(@PathVariable Long id) {
        return userService.getUser(id)
                .map(user -> ApiResponse.success("Lấy thông tin thành công", userService.toAuthUserResponse(user)))
                .orElseGet(() -> ApiResponse.error("ERR_USER_01", "Không tìm thấy người dùng"));
    }
}
