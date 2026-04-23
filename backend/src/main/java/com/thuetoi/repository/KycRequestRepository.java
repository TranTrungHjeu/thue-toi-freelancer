package com.thuetoi.repository;

import com.thuetoi.entity.KycRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycRequestRepository extends JpaRepository<KycRequest, Long> {
    List<KycRequest> findAllByOrderByCreatedAtDesc();
    List<KycRequest> findByStatusOrderByCreatedAtDesc(String status);
    Optional<KycRequest> findByUserId(Long userId);
}
