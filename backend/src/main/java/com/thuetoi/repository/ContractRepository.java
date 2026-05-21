package com.thuetoi.repository;

import com.thuetoi.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByClientIdOrFreelancerId(Long clientId, Long freelancerId);
    Optional<Contract> findByProjectId(Long projectId);
    long countByClientIdOrFreelancerId(Long clientId, Long freelancerId);

    @Query("SELECT COALESCE(SUM(c.totalAmount), 0) FROM Contract c WHERE c.status = 'completed'")
    BigDecimal calculateTotalGmv();

    long countByStatus(String status);

    @Query("SELECT c FROM Contract c WHERE c.status = :status AND c.endDate < :now")
    List<Contract> findExpiredContracts(@org.springframework.data.repository.query.Param("status") String status, @org.springframework.data.repository.query.Param("now") LocalDateTime now);
}
