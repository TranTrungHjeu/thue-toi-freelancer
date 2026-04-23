package com.thuetoi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.thuetoi.entity.WithdrawalRequest;

import jakarta.persistence.LockModeType;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();

    List<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WithdrawalRequest w WHERE w.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);
}
