package com.thuetoi.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.request.BankAccountRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.BankAccountResponse;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.BankAccountService;

import jakarta.validation.Valid;

/**
 * Quản lý tài khoản ngân hàng (đã lưu) của user hiện tại. Dùng để chọn nhanh
 * khi rút tiền và để admin có sẵn snapshot khi chuyển khoản thủ công.
 */
@RestController
@RequestMapping("/api/v1/users/me/bank-accounts")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @GetMapping
    public ApiResponse<List<BankAccountResponse>> listMine(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Danh sách tài khoản ngân hàng", bankAccountService.listForUser(userId));
    }

    @PostMapping
    public ApiResponse<BankAccountResponse> create(@Valid @RequestBody BankAccountRequest request, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Đã thêm tài khoản ngân hàng", bankAccountService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BankAccountResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody BankAccountRequest request,
        Principal principal
    ) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Đã cập nhật tài khoản ngân hàng", bankAccountService.update(userId, id, request));
    }

    @PostMapping("/{id}/default")
    public ApiResponse<BankAccountResponse> setDefault(@PathVariable Long id, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Đã đặt làm tài khoản mặc định", bankAccountService.setDefault(userId, id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        bankAccountService.delete(userId, id);
        return ApiResponse.success("Đã xóa tài khoản ngân hàng", null);
    }
}
