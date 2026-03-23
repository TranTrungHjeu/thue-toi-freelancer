package com.thuetoi.repository;

import com.thuetoi.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByClientIdOrFreelancerId(Long clientId, Long freelancerId);
}
