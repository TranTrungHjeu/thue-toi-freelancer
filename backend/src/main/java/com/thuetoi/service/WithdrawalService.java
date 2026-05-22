package com.thuetoi.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thuetoi.dto.request.BankAccountRequest;
import com.thuetoi.dto.request.WithdrawalCreateRequest;
import com.thuetoi.dto.response.WithdrawalResponse;
import com.thuetoi.entity.BankAccount;
import com.thuetoi.entity.SystemSetting;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WithdrawalRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WithdrawalRequestRepository;
import com.thuetoi.sepay.SePayApiClient;

/**
 * Quản lý yêu cầu rút tiền phía user.
 *
 * Luồng tự động hoàn tất:
 *   1) {@link #createForUser(Long, WithdrawalCreateRequest)} -> hold balance, status=PENDING, sinh order_code.
 *   2) Admin duyệt qua AdminService -> approvedAt set, status=APPROVED.
 *   3) Admin chuyển khoản thủ công và GHI {@link WithdrawalRequest#getOrderCode()} vào nội dung chuyển khoản.
 *   4) SePay webhook (transferType=out) đến -> SePayWebhookService gọi
 *      {@link #completeFromWebhook(String, BigDecimal, String)} để đóng đơn.
 */
@Service
public class WithdrawalService {

    /** Mặc định mức rút tối thiểu nếu chưa cấu hình system_settings. */
    private static final BigDecimal DEFAULT_MIN_WITHDRAWAL = new BigDecimal("50000");

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BankAccountService bankAccountService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private SePayApiClient sePayApiClient;

    @Autowired
    private WithdrawalRealtimePublisher withdrawalRealtimePublisher;

    /** Max page size cứng theo khuyến nghị skill api-pagination. */
    public static final int MAX_PAGE_SIZE = 100;
    public static final int DEFAULT_PAGE_SIZE = 20;

    @Transactional(readOnly = true)
    public List<WithdrawalResponse> listForUser(Long userId) {
        return withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Paginated list cho user (offset pagination).
     * Page là 1-indexed (theo quy ước {@link com.thuetoi.dto.response.PagedResponse}).
     */
    @Transactional(readOnly = true)
    public Page<WithdrawalResponse> listForUserPaged(Long userId, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);
        return withdrawalRequestRepository
            .findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public WithdrawalResponse createForUser(Long userId, WithdrawalCreateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        BigDecimal amount = normalizeAmount(request.getAmount());
        BigDecimal minWithdrawal = getMinWithdrawalAmount();
        if (amount.compareTo(minWithdrawal) < 0) {
            throw new BusinessException(
                "ERR_WALLET_03",
                "Số tiền rút tối thiểu là " + minWithdrawal.toPlainString() + " VND",
                HttpStatus.BAD_REQUEST
            );
        }

        BigDecimal balance = user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;
        if (balance.compareTo(amount) < 0) {
            throw new BusinessException(
                "ERR_WALLET_02",
                "Số dư khả dụng không đủ để tạo yêu cầu rút tiền",
                HttpStatus.BAD_REQUEST
            );
        }

        WithdrawalRequest entity = new WithdrawalRequest();
        entity.setUserId(userId);
        entity.setAmount(amount);
        entity.setStatus(WithdrawalRequest.STATUS_PENDING);

        applyBankInfo(userId, entity, request);
        // Đặt tạm bankInfo trước khi lưu lần 1 để tránh lỗi NOT NULL constraint nếu DB chưa chạy V28 migration
        entity.setBankInfo(buildLegacyBankInfo(entity));

        // Lưu lần 1 để có ID -> dùng làm hậu tố cho order_code (unique, deterministic).
        WithdrawalRequest saved = withdrawalRequestRepository.save(entity);
        saved.setOrderCode(buildOrderCode(userId, saved.getId()));
        saved.setBankInfo(buildLegacyBankInfo(saved));
        saved = withdrawalRequestRepository.save(saved);

        walletService.holdForWithdrawal(userId, saved.getId(), amount, saved.getOrderCode());

        notificationService.createNotificationForUser(
            userId,
            "system",
            "Đã gửi yêu cầu rút tiền",
            "Yêu cầu rút " + amount.toPlainString() + " VND đang chờ Admin duyệt.",
            "/workspace/wallet"
        );

        // Notify tất cả admin để họ xử lý đơn rút mới — dùng broadcast theo role
        // (cùng pattern với report mới ở ReportController). Filter in-app preference
        // được áp dụng ở NotificationService.
        String requesterLabel = user.getFullName() != null && !user.getFullName().isBlank()
            ? user.getFullName()
            : (user.getEmail() != null ? user.getEmail() : "User #" + userId);
        notificationService.broadcastNotification(
            "admin",
            "system",
            "Có yêu cầu rút tiền mới",
            requesterLabel + " vừa gửi yêu cầu rút " + amount.toPlainString() + " VND. Mã đơn: " + saved.getOrderCode(),
            "/workspace/admin/withdrawals",
            null
        );

        withdrawalRealtimePublisher.publish(userId, saved.getId(), WithdrawalRealtimePublisher.TYPE_CREATED);
        return toResponse(saved);
    }

    @Transactional
    public WithdrawalResponse cancelOwn(Long userId, Long withdrawalId) {
        WithdrawalRequest entity = withdrawalRequestRepository.findByIdForUpdate(withdrawalId)
            .orElseThrow(() -> new BusinessException("ERR_WITHDRAWAL_01", "Không tìm thấy yêu cầu rút tiền", HttpStatus.NOT_FOUND));

        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền hủy yêu cầu này", HttpStatus.FORBIDDEN);
        }
        if (!WithdrawalRequest.STATUS_PENDING.equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException(
                "ERR_WITHDRAWAL_02",
                "Chỉ có thể hủy yêu cầu đang chờ duyệt",
                HttpStatus.BAD_REQUEST
            );
        }

        entity.setStatus(WithdrawalRequest.STATUS_REJECTED);
        entity.setNote("Người dùng tự hủy yêu cầu trước khi admin xử lý");
        WithdrawalRequest saved = withdrawalRequestRepository.save(entity);

        walletService.refundWithdrawalHold(userId, saved.getId(), saved.getAmount(), "Tự hủy");

        withdrawalRealtimePublisher.publish(userId, saved.getId(), WithdrawalRealtimePublisher.TYPE_CANCELLED);
        return toResponse(saved);
    }

    /**
     * Gọi từ SePay webhook khi phát hiện giao dịch chuyển ra (transferType=out) trùng order_code.
     * Idempotent: nếu đơn đã COMPLETED, không cần xử lý lại.
     */
    @Transactional
    public boolean completeFromWebhook(String orderCode, BigDecimal transferAmount, String sepayTransactionId) {
        Optional<WithdrawalRequest> opt = withdrawalRequestRepository.findByOrderCodeForUpdate(orderCode);
        if (opt.isEmpty()) {
            return false;
        }
        WithdrawalRequest entity = opt.get();

        if (WithdrawalRequest.STATUS_COMPLETED.equalsIgnoreCase(entity.getStatus())) {
            return true;
        }
        if (WithdrawalRequest.STATUS_REJECTED.equalsIgnoreCase(entity.getStatus())) {
            // Đã reject - tiền đã refund. Không tự động complete.
            return false;
        }

        // Phòng trường hợp số tiền chuyển khác request - vẫn complete để khớp nghiệp vụ,
        // nhưng ghi rõ trong note để admin theo dõi.
        if (transferAmount != null && entity.getAmount() != null) {
            int cmp = entity.getAmount().setScale(0, RoundingMode.HALF_UP)
                .compareTo(transferAmount.setScale(0, RoundingMode.HALF_UP));
            if (cmp != 0) {
                String existingNote = entity.getNote() == null ? "" : entity.getNote() + " | ";
                entity.setNote(existingNote + "[CẢNH BÁO] Số tiền webhook " + transferAmount + " khác request " + entity.getAmount());
            }
        }

        entity.setStatus(WithdrawalRequest.STATUS_COMPLETED);
        entity.setCompletedAt(LocalDateTime.now());
        entity.setSepayTransactionId(sepayTransactionId);
        WithdrawalRequest saved = withdrawalRequestRepository.save(entity);

        walletService.recordWithdrawalCompleted(saved.getUserId(), saved.getId(), saved.getAmount(), saved.getOrderCode(), sepayTransactionId);

        notificationService.createNotificationForUser(
            saved.getUserId(),
            "system",
            "Đã nhận tiền rút",
            "Yêu cầu rút " + saved.getAmount().toPlainString() + " VND đã hoàn tất. Vui lòng kiểm tra tài khoản ngân hàng.",
            "/workspace/wallet"
        );

        withdrawalRealtimePublisher.publish(saved.getUserId(), saved.getId(), WithdrawalRealtimePublisher.TYPE_COMPLETED);
        return true;
    }

    /**
     * Admin xác nhận đã chuyển khoản: gọi SePay API tra cứu giao dịch chuyển ra
     * (transferType=out) khớp <b>order_code</b> trước khi đóng đơn.
     * <p>Chỉ khi SePay xác nhận có giao dịch thực tế khớp mã đơn và đúng số tiền,
     * hệ thống mới chuyển trạng thái sang COMPLETED và trừ tiền hold vĩnh viễn.</p>
     *
     * @return WithdrawalResponse sau khi cập nhật (status=COMPLETED)
     * @throws BusinessException nếu chưa tìm thấy giao dịch trên SePay
     */
    @Transactional
    public WithdrawalResponse verifyAndComplete(Long withdrawalId, Long adminId, String adminNote) {
        WithdrawalRequest entity = withdrawalRequestRepository.findByIdForUpdate(withdrawalId)
            .orElseThrow(() -> new BusinessException(
                "ERR_WITHDRAWAL_01",
                "Không tìm thấy yêu cầu rút tiền",
                HttpStatus.NOT_FOUND
            ));

        if (WithdrawalRequest.STATUS_COMPLETED.equalsIgnoreCase(entity.getStatus())) {
            return toResponse(entity);
        }
        if (WithdrawalRequest.STATUS_REJECTED.equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessException(
                "ERR_WITHDRAWAL_05",
                "Yêu cầu đã bị từ chối, không thể xác nhận đã chuyển",
                HttpStatus.BAD_REQUEST
            );
        }

        if (entity.getOrderCode() == null || entity.getOrderCode().isBlank()) {
            throw new BusinessException(
                "ERR_WITHDRAWAL_06",
                "Yêu cầu thiếu mã đơn, không thể đối soát với SePay",
                HttpStatus.BAD_REQUEST
            );
        }

        Optional<JsonNode> txOpt = sePayApiClient
            .findOutgoingTransactionByOrderCode(entity.getOrderCode(), entity.getAmount());

        if (txOpt.isEmpty()) {
            throw new BusinessException(
                "ERR_WITHDRAWAL_07",
                "Bạn chưa thực hiện chuyển khoản. Hãy quét VietQR để chuyển tiền (mã đơn "
                    + entity.getOrderCode() + " đã có sẵn trong nội dung) rồi bấm Xác nhận lại.",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        JsonNode tx = txOpt.get();
        String sepayTxId = tx.has("id") && !tx.get("id").isNull()
            ? tx.get("id").asText()
            : null;

        LocalDateTime now = LocalDateTime.now();
        entity.setStatus(WithdrawalRequest.STATUS_COMPLETED);
        if (entity.getApprovedAt() == null) {
            entity.setApprovedAt(now);
        }
        entity.setCompletedAt(now);
        entity.setProcessedBy(adminId);
        entity.setSepayTransactionId(sepayTxId);
        if (adminNote != null && !adminNote.isBlank()) {
            entity.setNote(adminNote.trim());
        }
        WithdrawalRequest saved = withdrawalRequestRepository.save(entity);

        walletService.recordWithdrawalCompleted(
            saved.getUserId(),
            saved.getId(),
            saved.getAmount(),
            saved.getOrderCode(),
            sepayTxId
        );

        notificationService.createNotificationForUser(
            saved.getUserId(),
            "system",
            "Đã nhận tiền rút",
            "Yêu cầu rút " + saved.getAmount().toPlainString()
                + " VND đã được Admin xác nhận chuyển khoản (SePay tx: "
                + (sepayTxId != null ? sepayTxId : "n/a") + ").",
            "/workspace/wallet"
        );

        withdrawalRealtimePublisher.publish(saved.getUserId(), saved.getId(), WithdrawalRealtimePublisher.TYPE_COMPLETED);
        return toResponse(saved);
    }

    public WithdrawalResponse toResponse(WithdrawalRequest entity) {
        return new WithdrawalResponse(
            entity.getId(),
            entity.getAmount(),
            entity.getStatus(),
            entity.getBankName(),
            entity.getBankCode(),
            entity.getAccountNumber(),
            entity.getAccountHolder(),
            entity.getQrImageUrl(),
            entity.getOrderCode(),
            entity.getNote(),
            entity.getCreatedAt(),
            entity.getApprovedAt(),
            entity.getCompletedAt()
        );
    }

    private void applyBankInfo(Long userId, WithdrawalRequest entity, WithdrawalCreateRequest request) {
        if (request.getBankAccountId() != null) {
            BankAccount account = bankAccountService.requireOwned(userId, request.getBankAccountId());
            entity.setBankAccountId(account.getId());
            entity.setBankName(account.getBankName());
            entity.setBankCode(account.getBankCode());
            entity.setAccountNumber(account.getAccountNumber());
            entity.setAccountHolder(account.getAccountHolder());
            entity.setQrImageUrl(account.getQrImageUrl());
            return;
        }

        String bankName = trimToNull(request.getBankName());
        String accountNumber = trimToNull(request.getAccountNumber());
        String accountHolder = trimToNull(request.getAccountHolder());
        if (bankName == null || accountNumber == null || accountHolder == null) {
            throw new BusinessException(
                "ERR_WITHDRAWAL_03",
                "Vui lòng cung cấp đầy đủ tên ngân hàng, số tài khoản và tên chủ tài khoản",
                HttpStatus.BAD_REQUEST
            );
        }

        entity.setBankName(bankName);
        entity.setBankCode(trimToNull(request.getBankCode()));
        entity.setAccountNumber(accountNumber);
        entity.setAccountHolder(accountHolder);
        entity.setQrImageUrl(trimToNull(request.getQrImageUrl()));

        if (Boolean.TRUE.equals(request.getSaveBankAccount())) {
            BankAccountRequest saveReq = new BankAccountRequest();
            saveReq.setBankName(bankName);
            saveReq.setBankCode(entity.getBankCode());
            saveReq.setAccountNumber(accountNumber);
            saveReq.setAccountHolder(accountHolder);
            saveReq.setQrImageUrl(entity.getQrImageUrl());
            saveReq.setIsDefault(false);
            try {
                bankAccountService.create(userId, saveReq);
            } catch (BusinessException ignored) {
                // Đạt giới hạn tài khoản hoặc lỗi tương tự - không chặn luồng tạo withdrawal.
            }
        }
    }

    private BigDecimal normalizeAmount(BigDecimal raw) {
        if (raw == null) {
            throw new BusinessException("ERR_WALLET_03", "Số tiền rút không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return raw.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal getMinWithdrawalAmount() {
        return systemSettingRepository.findById("min_withdrawal_amount")
            .map(SystemSetting::getValue)
            .map(value -> {
                try {
                    return new BigDecimal(value.trim());
                } catch (Exception ignored) {
                    return DEFAULT_MIN_WITHDRAWAL;
                }
            })
            .orElse(DEFAULT_MIN_WITHDRAWAL);
    }

    private static String buildOrderCode(Long userId, Long requestId) {
        return "TTW" + userId + "R" + requestId + "X"
            + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private static String buildLegacyBankInfo(WithdrawalRequest entity) {
        StringBuilder sb = new StringBuilder();
        sb.append(entity.getBankName() != null ? entity.getBankName() : "");
        sb.append(" - STK ").append(entity.getAccountNumber() != null ? entity.getAccountNumber() : "");
        sb.append(" - CT: ").append(entity.getAccountHolder() != null ? entity.getAccountHolder() : "");
        if (entity.getOrderCode() != null) {
            sb.append(" - Mã đơn: ").append(entity.getOrderCode());
        }
        return sb.toString();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
