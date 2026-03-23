package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Milestone;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
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

    /**
     * Lấy toàn bộ milestone mà user hiện tại được phép xem.
     */
    @GetMapping
    public ApiResponse<List<Milestone>> getAllMilestones(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Milestone> milestones = contractService.getMilestonesByUser(currentUserId);
        return ApiResponse.success("Lấy danh sách milestone có thể truy cập", milestones);
    }
}
