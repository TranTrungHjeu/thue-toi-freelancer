package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.PaymentOrderResponse;
import com.thuetoi.service.PaymentService;
import com.thuetoi.security.CurrentUserProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @GetMapping("/{orderCode}")
    public ApiResponse<PaymentOrderResponse> getStatus(@PathVariable String orderCode, Principal principal) {
        long uid = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Trạng thái thanh toán", paymentService.getStatusForCustomerWithSync(orderCode, uid));
    }

    @PostMapping("/{orderCode}/cancel")
    public ApiResponse<PaymentOrderResponse> cancel(@PathVariable String orderCode, Principal principal) {
        long uid = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Đã hủy đơn (nếu còn pending)", paymentService.toResponse(
            paymentService.cancelByCustomer(orderCode, uid)
        ));
    }

    @PostMapping("/wallet/pay-bid/{bidId}")
    public ApiResponse<String> payBidWithWallet(@PathVariable Long bidId, Principal principal) {
        long customerId = currentUserProvider.requireCurrentUserId(principal);
        paymentService.payBidWithWallet(bidId, customerId);
        return ApiResponse.success("Thanh toán thành công và hợp đồng đã được tạo", null);
    }
}
