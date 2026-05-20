package com.thuetoi.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.SystemSetting;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WalletLedgerEntry;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WalletLedgerEntryRepository;

@Service
@Transactional
public class WalletService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletLedgerEntryRepository walletLedgerEntryRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    public Map<String, Object> getWalletMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        BigDecimal balance = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;

        // Calculate escrow from active contracts (ACTIVE, IN_PROGRESS, PENDING_COMPLETION)
        BigDecimal escrow = BigDecimal.ZERO;
        // Calculate pending from unreleased milestones
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal totalBalance = balance.add(escrow).add(pending);

        Map<String, Object> wallet = new HashMap<>();
        wallet.put("balance", balance);
        wallet.put("escrow", escrow);
        wallet.put("pending", pending);
        wallet.put("total", totalBalance);
        wallet.put("source", "Database: userId=" + userId + ", email=" + user.getEmail() + ", balance=" + balance);

        System.out.println("[WALLET DEBUG] getWalletMe - userId=" + userId + ", balance=" + balance + ", user.getBalance()=" + user.getBalance());

        return wallet;
    }

    public List<WalletLedgerEntry> getWalletLedger(Long userId) {
        return walletLedgerEntryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void deposit(Long userId, BigDecimal amount) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        user.setBalance((user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO).add(amount));
        userRepository.save(user);

        WalletLedgerEntry entry = new WalletLedgerEntry();
        entry.setUserId(userId);
        entry.setAmount(amount);
        entry.setEntryType("DEPOSIT");
        entry.setDescription("Nạp tiền vào ví qua hệ thống");
        walletLedgerEntryRepository.save(entry);

        notificationService.createNotificationForUser(
                userId,
                "system",
                "Nạp tiền thành công",
                "Bạn đã nạp thành công " + amount + " VND vào ví.",
                "/workspace/wallet"
        );
    }

    @Transactional
    public void recordEscrowIn(Long customerId, Long contractId, Long paymentOrderId, BigDecimal amount, String projectTitle) {
        User customer = userRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        if (customer.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("ERR_WALLET_01", "Số dư ví không đủ để thanh toán hợp đồng này", HttpStatus.BAD_REQUEST);
        }

        customer.setBalance(customer.getBalance().subtract(amount));
        userRepository.save(customer);

        WalletLedgerEntry paymentEntry = new WalletLedgerEntry();
        paymentEntry.setUserId(customerId);
        paymentEntry.setContractId(contractId);
        paymentEntry.setPaymentOrderId(paymentOrderId);
        paymentEntry.setAmount(amount.negate());
        paymentEntry.setEntryType("escrow_in");
        paymentEntry.setDescription("Thanh toán ký quỹ hợp đồng cho dự án: " + projectTitle);
        walletLedgerEntryRepository.save(paymentEntry);

        String subject = "Biên lai thanh toán ký quỹ - Hợp đồng #" + contractId;
        String content = "Xin chào " + customer.getFullName() + ",\n\n" +
                "Bạn đã thanh toán ký quỹ thành công cho hợp đồng #" + contractId + ".\n" +
                "Số tiền: " + amount + " VND\n" +
                "Dự án: " + projectTitle + "\n\n" +
                "Cảm ơn bạn đã sử dụng dịch vụ của Thuê Tôi Freelancer!";

        emailService.sendEmail(customer.getEmail(), subject, content);
        notificationService.createNotificationForUser(
                customerId,
                "system",
                "Thanh toán ký quỹ thành công",
                "Biên lai giao dịch hợp đồng #" + contractId + " đã được gửi tới email của bạn.",
                "/workspace/wallet"
        );
    }

    @Transactional
    public void applyMilestoneNetToFreelancer(Contract contract, BigDecimal amount) {
        User freelancer = userRepository.findByIdForUpdate(contract.getFreelancerId())
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Freelancer không tồn tại", HttpStatus.NOT_FOUND));

        BigDecimal feePercent = getPlatformFeePercent();
        BigDecimal feeAmount = amount.multiply(feePercent).divide(new BigDecimal("100"));
        BigDecimal netAmount = amount.subtract(feeAmount);

        freelancer.setBalance((freelancer.getBalance() != null ? freelancer.getBalance() : BigDecimal.ZERO).add(netAmount));
        userRepository.save(freelancer);

        // Ledger: Release Milestone
        WalletLedgerEntry releaseEntry = new WalletLedgerEntry();
        releaseEntry.setUserId(freelancer.getId());
        releaseEntry.setContractId(contract.getId());
        releaseEntry.setAmount(amount);
        releaseEntry.setEntryType("release_milestone");
        releaseEntry.setDescription("Giải ngân milestone từ Hợp đồng #" + contract.getId());
        walletLedgerEntryRepository.save(releaseEntry);

        // Ledger: Platform Fee
        if (feeAmount.compareTo(BigDecimal.ZERO) > 0) {
            WalletLedgerEntry feeEntry = new WalletLedgerEntry();
            feeEntry.setUserId(freelancer.getId());
            feeEntry.setContractId(contract.getId());
            feeEntry.setAmount(feeAmount.negate());
            feeEntry.setEntryType("platform_fee");
            feeEntry.setDescription("Phí nền tảng (" + feePercent + "%) cho milestone Hợp đồng #" + contract.getId());
            walletLedgerEntryRepository.save(feeEntry);
        }

        String subject = "Thanh toán milestone đã được giải phóng";
        String content = "Xin chào " + freelancer.getFullName() + ",\n\n" +
                "Bạn đã nhận được khoản thanh toán giải phóng cho một milestone trong hợp đồng #" + contract.getId() + ".\n" +
                "Số tiền: " + amount + " VND\n\n" +
                "Hệ thống đã cộng tiền vào số dư khả dụng của bạn!";

        emailService.sendEmail(freelancer.getEmail(), subject, content);
    }

    @Transactional
    public void disburseContractTotalToFreelancer(Contract contract, BigDecimal amount) {
        User freelancer = userRepository.findByIdForUpdate(contract.getFreelancerId())
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Freelancer không tồn tại", HttpStatus.NOT_FOUND));

        BigDecimal feePercent = getPlatformFeePercent();
        BigDecimal feeAmount = amount.multiply(feePercent).divide(new BigDecimal("100"));
        BigDecimal netAmount = amount.subtract(feeAmount);

        freelancer.setBalance((freelancer.getBalance() != null ? freelancer.getBalance() : BigDecimal.ZERO).add(netAmount));
        userRepository.save(freelancer);

        // Ledger: Release Contract
        WalletLedgerEntry releaseEntry = new WalletLedgerEntry();
        releaseEntry.setUserId(freelancer.getId());
        releaseEntry.setContractId(contract.getId());
        releaseEntry.setAmount(amount);
        releaseEntry.setEntryType("release_milestone");
        releaseEntry.setDescription("Giải ngân hoàn tất Hợp đồng #" + contract.getId());
        walletLedgerEntryRepository.save(releaseEntry);

        // Ledger: Platform Fee
        if (feeAmount.compareTo(BigDecimal.ZERO) > 0) {
            WalletLedgerEntry feeEntry = new WalletLedgerEntry();
            feeEntry.setUserId(freelancer.getId());
            feeEntry.setContractId(contract.getId());
            feeEntry.setAmount(feeAmount.negate());
            feeEntry.setEntryType("platform_fee");
            feeEntry.setDescription("Phí nền tảng (" + feePercent + "%) cho Hợp đồng #" + contract.getId());
            walletLedgerEntryRepository.save(feeEntry);
        }

        String subject = "Thanh toán hợp đồng đã được hoàn tất";
        String content = "Xin chào " + freelancer.getFullName() + ",\n\n" +
                "Hợp đồng #" + contract.getId() + " đã được xác nhận hoàn thành bởi khách hàng.\n" +
                "Số tiền tổng cộng: " + amount + " VND\n" +
                "Phí nền tảng (" + feePercent + "%): " + feeAmount + " VND\n" +
                "Thực nhận: " + netAmount + " VND đã được giải ngân vào ví của bạn.\n\n" +
                "Cảm ơn bạn đã đóng góp cho dự án!";

        emailService.sendEmail(freelancer.getEmail(), subject, content);
        notificationService.createNotificationForUser(
                freelancer.getId(),
                "system",
                "Thanh toán hợp đồng hoàn tất",
                "Số tiền " + netAmount + " VND (sau khi trừ phí) của hợp đồng #" + contract.getId() + " đã được chuyển vào ví khả dụng.",
                "/workspace/wallet"
        );
    }

    private BigDecimal getPlatformFeePercent() {
        return systemSettingRepository.findById("platform_fee_percent")
                .map(setting -> {
                    try {
                        return new BigDecimal(setting.getValue());
                    } catch (Exception e) {
                        return new BigDecimal("10");
                    }
                })
                .orElse(new BigDecimal("10"));
    }

    @Transactional
    public void refundEscrowToCustomer(Contract contract, BigDecimal amount) {
        User customer = userRepository.findByIdForUpdate(contract.getClientId())
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Khách hàng không tồn tại", HttpStatus.NOT_FOUND));

        customer.setBalance((customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO).add(amount));
        userRepository.save(customer);

        WalletLedgerEntry refundEntry = new WalletLedgerEntry();
        refundEntry.setUserId(customer.getId());
        refundEntry.setContractId(contract.getId());
        refundEntry.setAmount(amount);
        refundEntry.setEntryType("REFUND");
        refundEntry.setDescription("Hoàn tiền tự động do hủy Hợp đồng #" + contract.getId());
        walletLedgerEntryRepository.save(refundEntry);

        String subject = "Hoàn tiền ký quỹ tự động - Hợp đồng #" + contract.getId();
        String content = "Xin chào " + customer.getFullName() + ",\n\n" +
                "Hợp đồng #" + contract.getId() + " đã bị hủy thành công.\n" +
                "Hệ thống đã tự động hoàn trả số tiền ký quỹ " + amount + " VND vào ví của bạn.\n\n" +
                "Số dư khả dụng hiện tại của bạn đã được cập nhật!";

        emailService.sendEmail(customer.getEmail(), subject, content);
        notificationService.createNotificationForUser(
                customer.getId(),
                "system",
                "Hoàn tiền ký quỹ tự động",
                "Số tiền " + amount + " VND của hợp đồng #" + contract.getId() + " đã được hoàn về ví khả dụng.",
                "/workspace/wallet"
        );
    }
}
