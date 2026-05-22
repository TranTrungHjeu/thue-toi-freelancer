package com.thuetoi.repository;

import com.thuetoi.entity.WalletLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {

    List<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Paginated variant: dùng cho endpoint /v1/wallet/me/ledger khi có ?page&limit.
     * Dựa trên composite index {@code idx_wle_user_created} (V23) để tránh filesort.
     */
    Page<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    boolean existsByPaymentOrderIdAndEntryType(Long paymentOrderId, String entryType);
}
