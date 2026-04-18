package com.thuetoi.repository;

import com.thuetoi.entity.TransactionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {
    List<TransactionHistory> findByContractIdOrderByCreatedAtDesc(Long contractId);
}
