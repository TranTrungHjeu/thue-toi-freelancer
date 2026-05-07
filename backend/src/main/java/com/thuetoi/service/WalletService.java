package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WalletLedgerEntry;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WalletLedgerEntryRepository;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.entity.SystemSetting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Sổ cái ví (ledger) và cập nhật số dư freelancer.
 */
@Service
public class WalletService {

    @Autowired
    private WalletLedgerEntryRepository walletLedgerEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Transactional
    public void recordEscrowIn(Long freelancerId, Long contractId, Long paymentOrderId, BigDecimal amount, String projectTitle) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.setUserId(freelancerId);
        e.setContractId(contractId);
        e.setPaymentOrderId(paymentOrderId);
        e.setEntryType("escrow_in");
        e.setAmount(amount);
        e.setDescription("Nạp tiền vào escrow (SePay) cho hợp đồng — " + (projectTitle != null ? projectTitle : ""));
        walletLedgerEntryRepository.save(e);
    }

    /**
     * Khi hoàn thành milestone: chuyển từ escrow sang số dư rút được (sau trừ phí sàn).
     */
    @Transactional
    public void applyMilestoneNetToFreelancer(Contract contract, BigDecimal grossAmount) {
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal feePercent = resolvePlatformFeePercent();
        BigDecimal fee = grossAmount.multiply(feePercent)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal net = grossAmount.subtract(fee);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }
        User freelancer = userRepository.findById(contract.getFreelancerId())
            .orElseThrow();
        BigDecimal current = freelancer.getBalance() == null ? BigDecimal.ZERO : freelancer.getBalance();
        freelancer.setBalance(current.add(net));
        userRepository.save(freelancer);

        if (net.compareTo(BigDecimal.ZERO) > 0) {
            WalletLedgerEntry rel = new WalletLedgerEntry();
            rel.setUserId(freelancer.getId());
            rel.setContractId(contract.getId());
            rel.setEntryType("release_milestone");
            rel.setAmount(net);
            rel.setDescription("Milestone: giải ngân tới số dư (sau trừ phí sàn)");
            walletLedgerEntryRepository.save(rel);
        }
        if (fee.compareTo(BigDecimal.ZERO) > 0) {
            WalletLedgerEntry fe = new WalletLedgerEntry();
            fe.setUserId(freelancer.getId());
            fe.setContractId(contract.getId());
            fe.setEntryType("platform_fee");
            fe.setAmount(fee);
            fe.setDescription("Phí sàn từ milestone (ước tính " + feePercent + "%)");
            walletLedgerEntryRepository.save(fe);
        }
    }

    private BigDecimal resolvePlatformFeePercent() {
        return systemSettingRepository.findById("platform_fee_percent")
            .map(SystemSetting::getValue)
            .map(BigDecimal::new)
            .orElse(new BigDecimal("10"));
    }
}
