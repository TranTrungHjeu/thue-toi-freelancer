package com.thuetoi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.thuetoi.entity.BankAccount;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    List<BankAccount> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<BankAccount> findByIdAndUserId(Long id, Long userId);

    Optional<BankAccount> findFirstByUserIdAndIsDefaultTrue(Long userId);

    long countByUserId(Long userId);

    @Modifying
    @Query("UPDATE BankAccount b SET b.isDefault = false WHERE b.userId = :userId AND b.id <> :exceptId")
    void clearDefaultExcept(@Param("userId") Long userId, @Param("exceptId") Long exceptId);

    @Modifying
    @Query("UPDATE BankAccount b SET b.isDefault = false WHERE b.userId = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);
}
