package com.thuetoi.controller;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.response.ApiResponse;
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

    @GetMapping("/me/ledger")
    public ApiResponse<List<WalletLedgerEntry>> getWalletLedger(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Lấy lịch sử giao dịch thành công", walletService.getWalletLedger(userId));
    }

    @PostMapping("/deposit")
    public ApiResponse<PaymentOrderResponse> deposit(Principal principal, @RequestBody Map<String, Object> payload) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        PaymentOrder order = paymentService.createWalletDepositOrder(userId, amount);
        return ApiResponse.success("Tạo mã QR nạp tiền thành công", paymentService.toResponse(order));
    }
}
