package com.thuetoi.service.scheduler;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Project;
import com.thuetoi.enums.ContractStatus;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.service.NotificationService;
import com.thuetoi.service.TelegramBotService;
import com.thuetoi.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class ExpiredContractJob implements ScheduledJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiredContractJob.class);

    private final ContractRepository contractRepository;
    private final ProjectRepository projectRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final TelegramBotService telegramBotService;
    private final SystemSettingRepository systemSettingRepository;

    public ExpiredContractJob(ContractRepository contractRepository,
                              ProjectRepository projectRepository,
                              WalletService walletService,
                              NotificationService notificationService,
                              TelegramBotService telegramBotService,
                              SystemSettingRepository systemSettingRepository) {
        this.contractRepository = contractRepository;
        this.projectRepository = projectRepository;
        this.walletService = walletService;
        this.notificationService = notificationService;
        this.telegramBotService = telegramBotService;
        this.systemSettingRepository = systemSettingRepository;
    }

    @Override
    public String getJobKey() {
        return "cron_expired_contracts";
    }

    @Override
    @Transactional
    public void run() {
        log.info("Running job: Scanning for expired contracts...");

        LocalDateTime now = LocalDateTime.now();
        List<Contract> expiredContracts = contractRepository.findExpiredContracts(ContractStatus.IN_PROGRESS.getValue(), now);

        if (expiredContracts.isEmpty()) {
            log.info("No expired contracts found.");
            return;
        }

        log.info("Found {} expired contracts. Processing refunds...", expiredContracts.size());

        BigDecimal feePercent = getPlatformFeePercent();

        for (Contract contract : expiredContracts) {
            try {
                // Update contract status
                contract.setStatus(ContractStatus.CANCELLED.getValue());
                contractRepository.save(contract);

                // Update project status
                projectRepository.findById(contract.getProjectId()).ifPresent(project -> {
                    project.setStatus(ProjectStatus.CANCELLED.getValue());
                    projectRepository.save(project);
                });

                // Calculate refund amount: total - fee
                BigDecimal totalAmount = contract.getTotalAmount();
                if (totalAmount == null) {
                    totalAmount = BigDecimal.ZERO;
                }

                BigDecimal feeAmount = totalAmount.multiply(feePercent).divide(new BigDecimal("100"));
                BigDecimal refundAmount = totalAmount.subtract(feeAmount);

                // Process refund
                if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                    walletService.refundEscrowToCustomer(contract, refundAmount);
                }

                // Notify Client
                String clientTitle = "Hợp đồng đã hết hạn";
                String clientContent = String.format("Hợp đồng #%d đã hết hạn. Hệ thống đã hủy hợp đồng, đóng dự án và hoàn lại %s VND (sau khi trừ phí nền tảng).", contract.getId(), refundAmount);
                String contractLink = "/contracts/" + contract.getId();

                notificationService.createNotificationForUser(
                        contract.getClientId(),
                        "system",
                        clientTitle,
                        clientContent,
                        contractLink
                );

                // Notify Freelancer
                String freelancerTitle = "Hợp đồng đã hết hạn";
                String freelancerContent = String.format("Hợp đồng #%d đã hết hạn do chưa được hoàn thành đúng hạn. Hợp đồng đã bị hủy.", contract.getId());

                notificationService.createNotificationForUser(
                        contract.getFreelancerId(),
                        "system",
                        freelancerTitle,
                        freelancerContent,
                        contractLink
                );

                // Telegram notifications
                projectRepository.findById(contract.getProjectId()).ifPresent(project -> {
                    // To Client
                    if (project.getUser().getTelegramChatId() != null && !project.getUser().getTelegramChatId().isEmpty()) {
                        telegramBotService.sendNotification(
                            project.getUser().getTelegramChatId(),
                            "⚠️ *" + clientTitle + "*\n\n" + clientContent + "\n\n[Xem hợp đồng](https://thuetoi.id.vn" + contractLink + ")"
                        );
                    }
                });

                // Note: Contract doesn't directly have freelancer Telegram info, usually we'd need to join or fetch freelancer user
                // For now, focus on the project owner (client). If we need to notify freelancer via Telegram, we need their user entity.

                log.info("Contract ID {} marked as expired/cancelled and refunded {}.", contract.getId(), refundAmount);
            } catch (Exception e) {
                log.error("Error processing expired contract ID {}: {}", contract.getId(), e.getMessage());
            }
        }
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
}
