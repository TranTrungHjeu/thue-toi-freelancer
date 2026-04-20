package com.thuetoi.repository;

import com.thuetoi.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByClientIdOrFreelancerId(Long clientId, Long freelancerId);
    Optional<Contract> findByProjectId(Long projectId);

    @Query("SELECT COALESCE(SUM(c.totalAmount), 0) FROM Contract c WHERE c.status <> 'cancelled'")
    double calculateTotalGmv();

    long countByStatus(String status);
}
