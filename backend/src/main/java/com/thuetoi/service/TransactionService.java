package com.thuetoi.service;

import com.thuetoi.entity.TransactionHistory;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.TransactionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service xử lý lịch sử giao dịch thanh toán
 */
@Service
public class TransactionService {

    @Autowired
    private TransactionHistoryRepository transactionHistoryRepository;

    /**
     * Tạo transaction mới
     */
    @Transactional
    public TransactionHistory createTransaction(Long contractId, BigDecimal amount, String method, String status) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("ERR_TRANSACTION_01", "Số tiền giao dịch phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }

        TransactionHistory transaction = new TransactionHistory();
        transaction.setContractId(contractId);
        transaction.setAmount(amount);
        transaction.setMethod(method);
        transaction.setStatus(status != null ? status.toLowerCase() : "pending");

        return transactionHistoryRepository.save(transaction);
    }

    /**
     * Lấy lịch sử giao dịch theo contract
     */
    public List<TransactionHistory> getTransactionsByContract(Long contractId) {
        return transactionHistoryRepository.findByContractIdOrderByCreatedAtDesc(contractId);
    }
}
