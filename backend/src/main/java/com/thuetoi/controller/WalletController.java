package com.thuetoi.controller;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.PagedResponse;
import com.thuetoi.dto.response.PaymentOrderResponse;
import com.thuetoi.entity.PaymentOrder;
import com.thuetoi.entity.WalletLedgerEntry;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.PaymentService;
import com.thuetoi.service.WalletService;

@RestController
@RequestMapping("/api/v1/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getWalletMe(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Lấy thông tin ví thành công", walletService.getWalletMe(userId));
    }

    /**
     * Lịch sử giao dịch ví của user.
     * Backwards-compatible: không truyền {@code page}/{@code limit} thì trả về list
     * như cũ. Khi có 1 trong 2 thì trả về {@link PagedResponse}.
     */
    @GetMapping("/me/ledger")
    public ApiResponse<?> getWalletLedger(
        Principal principal,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer limit
    ) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        if (page == null && limit == null) {
            List<WalletLedgerEntry> data = walletService.getWalletLedger(userId);
            return ApiResponse.success("Lấy lịch sử giao dịch thành công", data);
        }
        int effectivePage = page != null ? page : 1;
        int effectiveLimit = limit != null ? limit : WalletService.DEFAULT_PAGE_SIZE;
        Page<WalletLedgerEntry> result = walletService.getWalletLedgerPaged(userId, effectivePage, effectiveLimit);
        return ApiResponse.success(
            "Lấy lịch sử giao dịch thành công",
            PagedResponse.from(result, result.getContent())
        );
    }

    @PostMapping("/deposit")
    public ApiResponse<PaymentOrderResponse> deposit(Principal principal, @RequestBody Map<String, Object> payload) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        PaymentOrder order = paymentService.createWalletDepositOrder(userId, amount);
        return ApiResponse.success("Tạo mã QR nạp tiền thành công", paymentService.toResponse(order));
    }
}
