package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ContractRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Service dùng chung để kiểm tra quyền truy cập hợp đồng.
 */
@Service
public class ContractAccessService {

    private final ContractRepository contractRepository;

    public ContractAccessService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public Contract requireAccessibleContract(Long contractId, Long currentUserId) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new BusinessException("ERR_CONTRACT_01", "Không tìm thấy hợp đồng", HttpStatus.NOT_FOUND));

        if (!contract.getClientId().equals(currentUserId) && !contract.getFreelancerId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền truy cập hợp đồng này", HttpStatus.FORBIDDEN);
        }
        return contract;
    }

    public Contract requireCustomerContract(Long contractId, Long currentUserId) {
        Contract contract = requireAccessibleContract(contractId, currentUserId);
        if (!contract.getClientId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ customer của hợp đồng mới có thể thao tác chức năng này", HttpStatus.FORBIDDEN);
        }
        return contract;
    }
}
