package com.thuetoi.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thuetoi.dto.request.BankAccountRequest;
import com.thuetoi.dto.response.BankAccountResponse;
import com.thuetoi.entity.BankAccount;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BankAccountRepository;

/**
 * Quản lý tài khoản ngân hàng đã lưu của user. Mỗi user chỉ thấy & sửa được tài khoản của mình.
 * Một user tối đa giữ {@value #MAX_ACCOUNTS_PER_USER} tài khoản để tránh spam dữ liệu.
 */
@Service
public class BankAccountService {

    private static final int MAX_ACCOUNTS_PER_USER = 10;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Transactional(readOnly = true)
    public List<BankAccountResponse> listForUser(Long userId) {
        return bankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public BankAccountResponse create(Long userId, BankAccountRequest request) {
        if (bankAccountRepository.countByUserId(userId) >= MAX_ACCOUNTS_PER_USER) {
            throw new BusinessException(
                "ERR_BANK_ACCOUNT_01",
                "Bạn đã đạt giới hạn " + MAX_ACCOUNTS_PER_USER + " tài khoản đã lưu. Hãy xóa bớt trước khi thêm mới.",
                HttpStatus.BAD_REQUEST
            );
        }

        BankAccount entity = new BankAccount();
        entity.setUserId(userId);
        applyRequest(entity, request);

        boolean wantsDefault = Boolean.TRUE.equals(request.getIsDefault())
            || bankAccountRepository.countByUserId(userId) == 0;
        entity.setIsDefault(wantsDefault);

        BankAccount saved = bankAccountRepository.save(entity);

        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            bankAccountRepository.clearDefaultExcept(userId, saved.getId());
        }

        return toResponse(saved);
    }

    @Transactional
    public BankAccountResponse update(Long userId, Long id, BankAccountRequest request) {
        BankAccount entity = bankAccountRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(
                "ERR_BANK_ACCOUNT_02",
                "Không tìm thấy tài khoản ngân hàng",
                HttpStatus.NOT_FOUND
            ));

        applyRequest(entity, request);

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            entity.setIsDefault(true);
        }

        BankAccount saved = bankAccountRepository.save(entity);

        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            bankAccountRepository.clearDefaultExcept(userId, saved.getId());
        }
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        BankAccount entity = bankAccountRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(
                "ERR_BANK_ACCOUNT_02",
                "Không tìm thấy tài khoản ngân hàng",
                HttpStatus.NOT_FOUND
            ));
        bankAccountRepository.delete(entity);

        if (Boolean.TRUE.equals(entity.getIsDefault())) {
            bankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .findFirst()
                .ifPresent(next -> {
                    next.setIsDefault(true);
                    bankAccountRepository.save(next);
                });
        }
    }

    @Transactional
    public BankAccountResponse setDefault(Long userId, Long id) {
        BankAccount entity = bankAccountRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(
                "ERR_BANK_ACCOUNT_02",
                "Không tìm thấy tài khoản ngân hàng",
                HttpStatus.NOT_FOUND
            ));
        bankAccountRepository.clearDefaultForUser(userId);
        entity.setIsDefault(true);
        return toResponse(bankAccountRepository.save(entity));
    }

    /**
     * Lookup nội bộ dùng cho WithdrawalService - không expose ra controller.
     */
    @Transactional(readOnly = true)
    public BankAccount requireOwned(Long userId, Long id) {
        return bankAccountRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(
                "ERR_BANK_ACCOUNT_02",
                "Không tìm thấy tài khoản ngân hàng đã lưu",
                HttpStatus.NOT_FOUND
            ));
    }

    private void applyRequest(BankAccount entity, BankAccountRequest request) {
        entity.setBankName(request.getBankName().trim());
        entity.setBankCode(normalize(request.getBankCode()));
        entity.setAccountNumber(request.getAccountNumber().trim());
        entity.setAccountHolder(request.getAccountHolder().trim());
        entity.setQrImageUrl(normalize(request.getQrImageUrl()));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BankAccountResponse toResponse(BankAccount entity) {
        return new BankAccountResponse(
            entity.getId(),
            entity.getBankName(),
            entity.getBankCode(),
            entity.getAccountNumber(),
            entity.getAccountHolder(),
            entity.getQrImageUrl(),
            entity.getIsDefault(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
