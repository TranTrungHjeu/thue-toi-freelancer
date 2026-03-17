package com.thuetoi.controller;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.service.ContractService;
import com.thuetoi.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {
    @Autowired
    private ContractService contractService;

    @PostMapping
    public ApiResponse createContract(@RequestBody Contract contract) {
        Contract created = contractService.createContract(contract);
        return ApiResponse.success(created);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse getContractsByUser(@PathVariable Long userId) {
        List<Contract> contracts = contractService.getContractsByUser(userId);
        return ApiResponse.success(contracts);
    }

    @PostMapping("/{contractId}/milestones")
    public ApiResponse addMilestone(@PathVariable Long contractId, @RequestBody Milestone milestone) {
        milestone.setContractId(contractId);
        Milestone created = contractService.addMilestone(milestone);
        return ApiResponse.success(created);
    }

    @GetMapping("/{contractId}/milestones")
    public ApiResponse getMilestonesByContract(@PathVariable Long contractId) {
        List<Milestone> milestones = contractService.getMilestonesByContract(contractId);
        return ApiResponse.success(milestones);
    }

    @PutMapping("/{contractId}/status")
    public ApiResponse updateContractStatus(@PathVariable Long contractId, @RequestParam String status) {
        Contract updated = contractService.updateContractStatus(contractId, status);
        return ApiResponse.success(updated);
    }
}
