package com.thuetoi.controller;

import com.thuetoi.dto.request.MilestoneStatusRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.MilestoneResponse;
import com.thuetoi.entity.Milestone;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/milestones")
public class MilestoneController {
    @Autowired
    private ContractService contractService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    /**
     * Lấy toàn bộ milestone mà user hiện tại được phép xem.
     */
    @GetMapping
    public ApiResponse<List<MilestoneResponse>> getAllMilestones(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Milestone> milestones = contractService.getMilestonesByUser(currentUserId);
        return ApiResponse.success(
            "Lấy danh sách milestone có thể truy cập",
            marketplaceResponseMapper.toMilestoneResponses(milestones)
        );
    }

    @PutMapping("/{milestoneId}/status")
    public ApiResponse<MilestoneResponse> updateMilestoneStatus(
        @PathVariable Long milestoneId,
        @Valid @RequestBody MilestoneStatusRequest request,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Milestone updatedMilestone = contractService.updateMilestoneStatus(milestoneId, currentUserId, request.getStatus());
        return ApiResponse.success(
            "Cập nhật trạng thái milestone thành công",
            marketplaceResponseMapper.toMilestoneResponse(updatedMilestone)
        );
    }
}
