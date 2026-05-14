package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.WalletLedgerLineResponse;
import com.thuetoi.dto.response.WalletMeResponse;
import com.thuetoi.entity.WalletLedgerEntry;
import com.thuetoi.entity.User;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WalletLedgerEntryRepository;
import com.thuetoi.security.CurrentUserProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/wallet")
public class WalletController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletLedgerEntryRepository walletLedgerEntryRepository;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public ApiResponse<WalletMeResponse> me(Principal principal) {
        long uid = currentUserProvider.requireCurrentUserId(principal);
        User u = userRepository.findById(uid).orElseThrow();
        BigDecimal b = u.getBalance() == null ? BigDecimal.ZERO : u.getBalance();
        return ApiResponse.success("Số dư tài khoản", new WalletMeResponse(b));
    }

    @GetMapping("/me/ledger")
    public ApiResponse<List<WalletLedgerLineResponse>> ledger(Principal principal) {
        long uid = currentUserProvider.requireCurrentUserId(principal);
        List<WalletLedgerEntry> rows = walletLedgerEntryRepository.findByUserIdOrderByCreatedAtDesc(uid);
        List<WalletLedgerLineResponse> out = rows.stream()
            .map(e -> new WalletLedgerLineResponse(
                e.getEntryType(), e.getAmount(), e.getDescription(), e.getContractId(), e.getCreatedAt()
            ))
            .toList();
        return ApiResponse.success("Sổ cái (ledger)", out);
    }
}
