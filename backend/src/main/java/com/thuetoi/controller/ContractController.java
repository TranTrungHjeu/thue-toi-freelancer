package com.thuetoi.controller;

import com.thuetoi.dto.request.ContractCreateRequest;
import com.thuetoi.dto.request.MilestoneRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {
    @Autowired
    private ContractService contractService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    /**
     * Lấy tất cả hợp đồng mà user hiện tại được phép xem.
     */
    @GetMapping
    public ApiResponse<List<Contract>> getAllContracts(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Contract> contracts = contractService.getAllContracts(currentUserId);
        return ApiResponse.success("Lấy danh sách hợp đồng có thể truy cập", contracts);
    }

    @PostMapping
    public ApiResponse<Contract> createContract(@Valid @RequestBody ContractCreateRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Contract created = contractService.createContractFromBid(currentUserId, request.getBidId());
        return ApiResponse.success("Tạo hợp đồng thành công", created);
    }

    @GetMapping("/my")
    public ApiResponse<List<Contract>> getMyContracts(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Contract> contracts = contractService.getContractsByUser(currentUserId);
        return ApiResponse.success("Lấy hợp đồng của user hiện tại thành công", contracts);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Contract>> getContractsByUser(@PathVariable Long userId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        if (!userId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem hợp đồng của người dùng khác", HttpStatus.FORBIDDEN);
        }
        List<Contract> contracts = contractService.getContractsByUser(userId);
        return ApiResponse.success("Lấy hợp đồng theo user thành công", contracts);
    }

    @PostMapping("/{contractId}/milestones")
    public ApiResponse<Milestone> addMilestone(
        @PathVariable Long contractId,
        @Valid @RequestBody MilestoneRequest request,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Milestone created = contractService.addMilestone(
            contractId,
            currentUserId,
            request.getTitle(),
            request.getAmount(),
            request.getDueDate(),
            request.getStatus()
        );
        return ApiResponse.success("Tạo milestone thành công", created);
    }

    @GetMapping("/{contractId}/milestones")
    public ApiResponse<List<Milestone>> getMilestonesByContract(@PathVariable Long contractId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Milestone> milestones = contractService.getMilestonesByContract(contractId, currentUserId);
        return ApiResponse.success("Lấy milestone theo hợp đồng thành công", milestones);
    }

    @PutMapping("/{contractId}/status")
    public ApiResponse<Contract> updateContractStatus(@PathVariable Long contractId, @RequestParam String status, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Contract updated = contractService.updateContractStatus(contractId, currentUserId, status);
        return ApiResponse.success("Cập nhật trạng thái hợp đồng thành công", updated);
    }
}
