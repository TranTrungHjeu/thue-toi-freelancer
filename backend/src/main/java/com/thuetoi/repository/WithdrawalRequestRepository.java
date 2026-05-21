package com.thuetoi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * Paginated variant: endpoint /v1/wallet/withdrawals khi có ?page&limit.
     * Tận dụng composite index {@code idx_withdrawal_user_created} (V23).
     */
    Page<WithdrawalRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Đếm số đơn rút đang giữ tiền (PENDING / APPROVED) của user.
     * Tận dụng index {@code idx_withdrawal_user_status (user_id, status)}.
     */
    @Query(
        "SELECT COUNT(w) FROM WithdrawalRequest w "
        + "WHERE w.userId = :userId AND UPPER(w.status) IN ('PENDING', 'APPROVED')"
    )
    long countPendingByUserId(@Param("userId") Long userId);

    /**
     * Tổng số tiền các đơn rút đang giữ (PENDING / APPROVED) của user.
     * Dùng cho widget "Đang chờ rút" ở Wallet page — tránh load toàn bộ list rồi sum FE.
     */
    @Query(
        "SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w "
        + "WHERE w.userId = :userId AND UPPER(w.status) IN ('PENDING', 'APPROVED')"
    )
    java.math.BigDecimal sumPendingAmountByUserId(@Param("userId") Long userId);

    Optional<WithdrawalRequest> findByOrderCode(String orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WithdrawalRequest w WHERE w.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WithdrawalRequest w WHERE w.orderCode = :orderCode")
    Optional<WithdrawalRequest> findByOrderCodeForUpdate(@Param("orderCode") String orderCode);
}
