package com.thuetoi.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.request.WithdrawalCreateRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.PagedResponse;
import com.thuetoi.dto.response.WithdrawalResponse;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.WithdrawalService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/wallet/withdrawals")
public class WithdrawalController {

    @Autowired
    private WithdrawalService withdrawalService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    /**
     * Danh sách yêu cầu rút tiền của user hiện tại.
     * <p>Backwards-compatible: nếu không truyền {@code page} & {@code limit} thì trả về
     * {@code List<WithdrawalResponse>} (legacy). Khi có ít nhất một trong hai tham số,
     * trả về {@link PagedResponse} theo quy ước offset pagination.</p>
     */
    @GetMapping
    public ApiResponse<?> listMine(
        Principal principal,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer limit
    ) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        if (page == null && limit == null) {
            List<WithdrawalResponse> data = withdrawalService.listForUser(userId);
            return ApiResponse.success("Danh sách yêu cầu rút tiền của bạn", data);
        }
        int effectivePage = page != null ? page : 1;
        int effectiveLimit = limit != null ? limit : WithdrawalService.DEFAULT_PAGE_SIZE;
        Page<WithdrawalResponse> result = withdrawalService.listForUserPaged(userId, effectivePage, effectiveLimit);
        return ApiResponse.success(
            "Danh sách yêu cầu rút tiền của bạn",
            PagedResponse.from(result, result.getContent())
        );
    }

    @PostMapping
    public ApiResponse<WithdrawalResponse> create(@Valid @RequestBody WithdrawalCreateRequest request, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success(
            "Đã gửi yêu cầu rút tiền cho Quản trị viên",
            withdrawalService.createForUser(userId, request)
        );
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<WithdrawalResponse> cancel(@PathVariable Long id, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Đã hủy yêu cầu rút tiền", withdrawalService.cancelOwn(userId, id));
    }
}
