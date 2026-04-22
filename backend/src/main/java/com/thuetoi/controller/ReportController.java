package com.thuetoi.controller;

import java.security.Principal;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.request.ReportSubmitRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ReportRepository;
import com.thuetoi.security.CurrentUserProvider;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private ReportRepository reportRepository;

    @PostMapping
    public ApiResponse<Void> submitReport(@Valid @RequestBody ReportSubmitRequest payload, Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        String targetType = normalizeTargetType(payload.getTargetType());
        String reason = normalizeReason(payload.getReason());

        com.thuetoi.entity.Report report = new com.thuetoi.entity.Report();
        report.setReporterId(userId);
        report.setTargetType(targetType);
        report.setTargetId(payload.getTargetId());
        report.setReason(reason);
        report.setDescription(payload.getDescription());
        report.setStatus("PENDING");

        reportRepository.save(report);
        return ApiResponse.success("Báo cáo đã được gửi để xem xét", null);
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Loại đối tượng bị báo cáo không được để trống", HttpStatus.BAD_REQUEST);
        }

        String normalized = targetType.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("PROJECT", "USER").contains(normalized)) {
            throw new BusinessException("ERR_SYS_02", "Loại đối tượng bị báo cáo không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        return normalized;
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Lý do báo cáo không được để trống", HttpStatus.BAD_REQUEST);
        }

        String normalized = reason.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("spam", "inappropriate", "harassment", "other").contains(normalized)) {
            throw new BusinessException("ERR_SYS_02", "Lý do báo cáo không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        return normalized;
    }
}
