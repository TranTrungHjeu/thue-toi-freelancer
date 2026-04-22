package com.thuetoi.controller;

import java.security.Principal;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.KycRequest;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.KycRequestRepository;
import com.thuetoi.security.CurrentUserProvider;

@RestController
@RequestMapping("/api/v1/kyc")
public class KycController {

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private KycRequestRepository kycRequestRepository;

    @PostMapping("/request")
    public ApiResponse<KycRequest> requestVerification(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        Optional<KycRequest> existing = kycRequestRepository.findByUserId(userId);
        if (existing.isPresent() && "PENDING".equalsIgnoreCase(existing.get().getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu xác thực đang chờ xử lý", HttpStatus.CONFLICT);
        }

        KycRequest request = existing.orElse(new KycRequest());
        request.setUserId(userId);
        request.setStatus("PENDING");
        request.setNote(null);

        KycRequest saved;
        try {
            saved = kycRequestRepository.save(request);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu xác thực đang chờ xử lý", HttpStatus.CONFLICT, ex);
        }
        return ApiResponse.success("Đã gửi yêu cầu xác thực tới quản trị viên", saved);
    }

    @GetMapping("/my-status")
    public ApiResponse<KycRequest> getMyStatus(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return kycRequestRepository.findByUserId(userId)
            .map(req -> ApiResponse.success("Trạng thái KYC", req))
            .orElse(ApiResponse.success("Chưa có yêu cầu KYC", null));
    }
}
