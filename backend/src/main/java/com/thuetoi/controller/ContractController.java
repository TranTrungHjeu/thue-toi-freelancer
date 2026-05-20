package com.thuetoi.controller;

import com.thuetoi.dto.request.ContractCreateRequest;
import com.thuetoi.dto.request.MilestoneRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.ContractResponse;
import com.thuetoi.dto.response.marketplace.MilestoneResponse;
import com.thuetoi.dto.response.marketplace.TransactionResponse;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {
    @Autowired
    private ContractService contractService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    /**
     * Lấy tất cả hợp đồng mà user hiện tại được phép xem.
     */
    @GetMapping
    public ApiResponse<List<ContractResponse>> getAllContracts(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Contract> contracts = contractService.getAllContracts(currentUserId);
        return ApiResponse.success("Lấy danh sách hợp đồng có thể truy cập", marketplaceResponseMapper.toContractResponses(contracts));
    }

    @PostMapping
    public ApiResponse<ContractResponse> createContract(@Valid @RequestBody ContractCreateRequest request, Principal principal) {
        throw new BusinessException(
            "ERR_PAYMENT_01",
            "Hợp đồng chỉ được tạo sau khi thanh toán SePay. Dùng POST /api/v1/bids/{bidId}/checkout rồi quét VA/QR.",
            HttpStatus.BAD_REQUEST
        );
    }

    @GetMapping("/my")
    public ApiResponse<List<ContractResponse>> getMyContracts(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Contract> contracts = contractService.getContractsByUser(currentUserId);
        return ApiResponse.success("Lấy hợp đồng của user hiện tại thành công", marketplaceResponseMapper.toContractResponses(contracts));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<ContractResponse>> getContractsByUser(@PathVariable Long userId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        if (!userId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem hợp đồng của người dùng khác", HttpStatus.FORBIDDEN);
        }
        List<Contract> contracts = contractService.getContractsByUser(userId);
        return ApiResponse.success("Lấy hợp đồng theo user thành công", marketplaceResponseMapper.toContractResponses(contracts));
    }

    @PostMapping("/{contractId}/milestones")
    public ApiResponse<MilestoneResponse> addMilestone(
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
            parseDueDate(request.getDueDate()),
            request.getStatus()
        );
        return ApiResponse.success("Tạo milestone thành công", marketplaceResponseMapper.toMilestoneResponse(created));
    }

    @GetMapping("/{contractId}/milestones")
    public ApiResponse<List<MilestoneResponse>> getMilestonesByContract(@PathVariable Long contractId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Milestone> milestones = contractService.getMilestonesByContract(contractId, currentUserId);
        return ApiResponse.success("Lấy milestone theo hợp đồng thành công", marketplaceResponseMapper.toMilestoneResponses(milestones));
    }

    @PutMapping("/{contractId}/status")
    public ApiResponse<ContractResponse> updateContractStatus(@PathVariable Long contractId, @RequestParam String status, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Contract updated = contractService.updateContractStatus(contractId, currentUserId, status);
        return ApiResponse.success("Cập nhật trạng thái hợp đồng thành công", marketplaceResponseMapper.toContractResponse(updated));
    }

    @GetMapping("/{contractId}/transactions")
    public ApiResponse<List<TransactionResponse>> getTransactionsByContract(@PathVariable Long contractId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success(
            "Lấy lịch sử giao dịch theo hợp đồng thành công",
            marketplaceResponseMapper.toTransactionResponses(contractService.getTransactionsByContract(contractId, currentUserId))
        );
    }

    private LocalDateTime parseDueDate(String dueDate) {
        if (dueDate == null || dueDate.trim().isEmpty()) {
            return null;
        }

        String normalizedDueDate = dueDate.trim();
        try {
            return OffsetDateTime.parse(normalizedDueDate).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(normalizedDueDate);
            } catch (DateTimeParseException ex) {
                throw new BusinessException(
                    "ERR_SYS_02",
                    "Định dạng dueDate không hợp lệ. Hãy dùng ISO-8601, ví dụ 2026-03-31T19:02:35 hoặc 2026-03-31T19:02:35+07:00",
                    HttpStatus.BAD_REQUEST,
                    ex
                );
            }
        }
    }
}
