package com.thuetoi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.thuetoi.entity.Bid;
import com.thuetoi.entity.PaymentOrder;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.BidStatus;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.PaymentOrderRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.config.SePayProperties;
import com.thuetoi.dto.response.PaymentOrderResponse;
import com.thuetoi.sepay.SePayApiClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentService {

    public static final String ST_PENDING = "pending";
    public static final String ST_PAID = "paid";
    public static final String ST_EXPIRED = "expired";
    public static final String ST_CANCELLED = "cancelled";
    public static final String ST_FAILED = "failed";

    private static final DateTimeFormatter SEPAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private SePayApiClient sePayApiClient;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractService contractService;

    @Autowired
    private SePayProperties sePayProperties;

    @Autowired
    private WalletService walletService;

    @Autowired
    private PaymentRealtimePublisher paymentRealtimePublisher;

    /**
     * Tạo đơn VA SePay cho việc nạp tiền vào ví khả dụng.
     */
    @Transactional
    public PaymentOrder createWalletDepositOrder(long customerId, java.math.BigDecimal amount) {
        if (!sePayApiClient.isConfigured()) {
            throw new BusinessException("ERR_PAYMENT_03", "Thiếu cấu hình SePay (API token, bank account xid).", HttpStatus.SERVICE_UNAVAILABLE);
        }
        User customer = getRequiredUser(customerId);

        long amountVnd = amount.setScale(0, RoundingMode.HALF_UP).longValueExact();
        if (amountVnd < 10000) {
            throw new BusinessException("ERR_PAYMENT_02", "Số tiền nạp tối thiểu là 10.000 VND", HttpStatus.BAD_REQUEST);
        }

        String orderCode = buildDepositOrderCode(customerId);
        JsonNode sepay = sePayApiClient.createOrder(orderCode, amountVnd);

        String resolvedCode = (sepay.get("order_code") != null && !sepay.get("order_code").isNull())
            ? sepay.get("order_code").asText()
            : null;

        PaymentOrder po = new PaymentOrder();
        po.setOrderCode(resolvedCode != null ? resolvedCode : orderCode);
        po.setProvider("sepay");
        po.setBid(null);
        po.setProjectId(null);
        po.setCustomer(customer);
        po.setAmount(amount);
        po.setStatus(ST_PENDING);
        po.setSepayOrderXid(getText(sepay, "id"));
        po.setVaNumber(getText(sepay, "va_number"));
        po.setVaHolderName(getText(sepay, "va_holder_name"));
        po.setBankName(getText(sepay, "bank_name"));
        po.setAccountNumber(getText(sepay, "account_number"));
        if (sepay.get("qr_code") != null && !sepay.get("qr_code").isNull()) {
            po.setQrCode(sepay.get("qr_code").asText());
        }
        if (sepay.get("qr_code_url") != null && !sepay.get("qr_code_url").isNull()) {
            po.setQrCodeUrl(sepay.get("qr_code_url").asText());
        }
        if (sepay.get("expired_at") != null && !sepay.get("expired_at").isNull()) {
            po.setExpiredAt(parseSePayTime(getText(sepay, "expired_at")));
        }

        return paymentOrderRepository.save(po);
    }

    /**
     * Customer tạo đơn VA (checkout) cho bid đang chờ, chuyển project sang pending_payment.
     */
    public PaymentOrder startCheckoutForBid(long bidId, long customerId) {
        if (!sePayApiClient.isConfigured()) {
            throw new BusinessException("ERR_PAYMENT_03", "Thiếu cấu hình SePay (API token, bank account xid).", HttpStatus.SERVICE_UNAVAILABLE);
        }
        JsonNode sepay;
        String orderCode;
        {
            getRequiredUser(customerId);
            ensureCustomerRoleById(customerId);
            Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));
            if (!bid.getProject().getUser().getId().equals(customerId)) {
                throw new BusinessException("ERR_AUTH_04", "Bạn không sở hữu dự án này", HttpStatus.FORBIDDEN);
            }
            if (!BidStatus.PENDING.matches(bid.getStatus())) {
                throw new BusinessException("ERR_SYS_02", "Chỉ thanh toán cho bid đang ở trạng thái chờ", HttpStatus.BAD_REQUEST);
            }
            Project project = bid.getProject();
            if (project.getId() == null) {
                throw new BusinessException("ERR_SYS_02", "Dự án chưa được lưu hợp lệ", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            if (contractRepository.findByProjectId(project.getId()).isPresent()) {
                throw new BusinessException("ERR_CONTRACT_02", "Dự án đã có hợp đồng", HttpStatus.CONFLICT);
            }
            if (ProjectStatus.PENDING_PAYMENT.matches(project.getStatus())) {
                List<PaymentOrder> blocking = paymentOrderRepository.findWithBidByProjectIdAndStatusIn(
                    project.getId(), List.of(ST_PENDING, ST_PAID)
                );
                for (PaymentOrder p : blocking) {
                    if (ST_PAID.equals(p.getStatus())) {
                        throw new BusinessException("ERR_CONTRACT_02", "Dự án đã thanh toán, đã hoặc sắp có hợp đồng", HttpStatus.CONFLICT);
                    }
                    if (p.getBid() == null) {
                        continue;
                    }
                    if (!p.getBid().getId().equals(bid.getId())) {
                        throw new BusinessException(
                            "ERR_PAYMENT_02",
                            "Dự án đang có đơn thanh toán cho bid khác. Hủy trước khi thử lại.",
                            HttpStatus.CONFLICT
                        );
                    }
                }
            } else if (!ProjectStatus.OPEN.matches(project.getStatus())) {
                throw new BusinessException("ERR_SYS_02", "Dự án không mở để thanh toán", HttpStatus.BAD_REQUEST);
            }
            orderCode = buildOrderCode(bid);
            long amountVnd = bid.getPrice().setScale(0, RoundingMode.HALF_UP).longValueExact();
            if (amountVnd <= 0) {
                throw new BusinessException("ERR_SYS_02", "Số tiền bid không hợp lệ", HttpStatus.BAD_REQUEST);
            }
            List<PaymentOrder> oldPend = paymentOrderRepository.findWithBidByProjectIdAndStatusIn(
                project.getId(), List.of(ST_PENDING)
            );
            for (PaymentOrder p : oldPend) {
                if (p.getSepayOrderXid() != null) {
                    sePayApiClient.cancelOrder(p.getSepayOrderXid());
                }
                p.setStatus(ST_CANCELLED);
                paymentOrderRepository.save(p);
            }
            sepay = sePayApiClient.createOrder(orderCode, amountVnd);
        }
        return persistCheckoutInTx(bidId, customerId, orderCode, sepay);
    }

    @Transactional
    public PaymentOrder persistCheckoutInTx(long bidId, long customerId, String requestedOrderCode, JsonNode sepay) {
        Bid bid = bidRepository.findById(bidId)
            .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));
        User customer = getRequiredUser(customerId);
        ensureCustomerRole(customer);
        Project project = bid.getProject();
        String resolvedCode = (sepay.get("order_code") != null && !sepay.get("order_code").isNull())
            ? sepay.get("order_code").asText()
            : null;
        PaymentOrder po = new PaymentOrder();
        po.setOrderCode(resolvedCode != null ? resolvedCode : requestedOrderCode);
        po.setProvider("sepay");
        po.setBid(bid);
        po.setProjectId(project.getId());
        po.setCustomer(customer);
        po.setAmount(bid.getPrice());
        po.setStatus(ST_PENDING);
        po.setSepayOrderXid(getText(sepay, "id"));
        po.setVaNumber(getText(sepay, "va_number"));
        po.setVaHolderName(getText(sepay, "va_holder_name"));
        po.setBankName(getText(sepay, "bank_name"));
        po.setAccountNumber(getText(sepay, "account_number"));
        if (sepay.get("qr_code") != null && !sepay.get("qr_code").isNull()) {
            po.setQrCode(sepay.get("qr_code").asText());
        }
        if (sepay.get("qr_code_url") != null && !sepay.get("qr_code_url").isNull()) {
            po.setQrCodeUrl(sepay.get("qr_code_url").asText());
        }
        if (sepay.get("expired_at") != null && !sepay.get("expired_at").isNull()) {
            po.setExpiredAt(parseSePayTime(getText(sepay, "expired_at")));
        }
        paymentOrderRepository.save(po);
        project.setStatus(ProjectStatus.PENDING_PAYMENT.getValue());
        projectRepository.save(project);
        return paymentOrderRepository.findById(po.getId()).orElse(po);
    }

    /**
     * Thanh toán ngay bằng ví cho bid. Chuyển tiền sang ký quỹ và tạo hợp đồng.
     */
    @Transactional
    public void payBidWithWallet(long bidId, long customerId) {
        // Delegate directly to the secure wallet checkout flow in ContractService
        contractService.createContractFromWallet(bidId, customerId);
    }

    @Transactional
    public void afterPaymentReceived(PaymentOrder order) {
        // Tải lại đơn hàng với Pessimistic Lock để chặn tuyệt đối Race Condition / Webhook Retry
        PaymentOrder detailed = paymentOrderRepository.findByIdForUpdate(order.getId())
            .orElseThrow(() -> new BusinessException("ERR_PAYMENT_01", "Không tìm thấy đơn thanh toán", HttpStatus.NOT_FOUND));

        if (!ST_PENDING.equals(detailed.getStatus()) && !ST_PAID.equals(detailed.getStatus())) {
            return;
        }

        if (ST_PENDING.equals(detailed.getStatus())) {
            detailed.setStatus(ST_PAID);
            if (detailed.getPaidAt() == null) {
                detailed.setPaidAt(LocalDateTime.now());
            }
            paymentOrderRepository.save(detailed);

            // Notify via WebSocket
            paymentRealtimePublisher.publishStatusUpdate(detailed.getOrderCode(), ST_PAID, detailed.getProjectId());
        }

        // Load chi tiết (customer, project, bid) để phục vụ logic nghiệp vụ tiếp theo
        detailed = paymentOrderRepository.findDetailedByOrderCode(detailed.getOrderCode())
            .orElse(detailed);

        // Phân biệt đơn nạp tiền (deposit) và đơn thanh toán hợp đồng (contract checkout)
        if (detailed.getProjectId() == null) {
            walletService.depositFromPaymentOrder(detailed.getCustomer().getId(), detailed.getId(), detailed.getAmount());
            return;
        }

        if (contractRepository.findByProjectId(detailed.getProjectId()).isPresent()) {
            return;
        }
        contractService.fulfillContractAfterPayment(detailed);
    }

    public PaymentOrderResponse toResponse(PaymentOrder p) {
        return new PaymentOrderResponse(
            p.getOrderCode(),
            p.getStatus(),
            p.getAmount(),
            p.getVaNumber(),
            p.getVaHolderName(),
            p.getBankName(),
            p.getAccountNumber(),
            p.getQrCode(),
            p.getQrCodeUrl(),
            p.getExpiredAt(),
            p.getPaidAt(),
            p.getProjectId(),
            buildVietQrUrl(p)
        );
    }

    private String buildVietQrUrl(PaymentOrder p) {
        String bankId = sePayProperties.getVietqrBankId();
        String account = p.getAccountNumber();
        if (bankId == null || bankId.isBlank() || account == null || account.isBlank()) {
            return null;
        }
        long amountVnd = p.getAmount() == null ? 0
            : p.getAmount().setScale(0, RoundingMode.HALF_UP).longValue();
        String holderName = p.getVaHolderName() != null ? p.getVaHolderName() : "";
        String orderCode = p.getOrderCode() != null ? p.getOrderCode() : "";
        return "https://img.vietqr.io/image/" + bankId + "-" + account + "-compact2.png"
            + "?amount=" + amountVnd
            + "&addInfo=" + java.net.URLEncoder.encode(orderCode, java.nio.charset.StandardCharsets.UTF_8)
            + "&accountName=" + java.net.URLEncoder.encode(holderName, java.nio.charset.StandardCharsets.UTF_8);
    }

    @Transactional
    public PaymentOrder cancelByCustomer(String orderCode, long customerId) {
        PaymentOrder po = paymentOrderRepository.findByOrderCodeAndCustomerId(orderCode, customerId)
            .orElseThrow(() -> new BusinessException("ERR_PAYMENT_02", "Không tìm thấy đơn thanh toán", HttpStatus.NOT_FOUND));
        if (!ST_PENDING.equals(po.getStatus())) {
            return po;
        }
        if (sePayApiClient.isConfigured() && po.getSepayOrderXid() != null) {
            sePayApiClient.cancelOrder(po.getSepayOrderXid());
        }
        po.setStatus(ST_CANCELLED);
        paymentOrderRepository.save(po);
        Project project = projectRepository.findById(po.getProjectId())
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        if (ProjectStatus.PENDING_PAYMENT.matches(project.getStatus())
            && contractRepository.findByProjectId(project.getId()).isEmpty()) {
            project.setStatus(ProjectStatus.OPEN.getValue());
            projectRepository.save(project);
        }
        return po;
    }

    @Transactional
    public PaymentOrderResponse getStatusForCustomerWithSync(String orderCode, long customerId) {
        PaymentOrder p = paymentOrderRepository.findByOrderCodeAndCustomerId(orderCode, customerId)
            .orElseThrow(() -> new BusinessException("ERR_PAYMENT_02", "Không tìm thấy đơn thanh toán", HttpStatus.NOT_FOUND));
        if (ST_PENDING.equals(p.getStatus()) && p.getSepayOrderXid() != null && sePayApiClient.isConfigured()) {
            syncAndMaybeFulfill(p);
        }
        return toResponse(paymentOrderRepository.findByOrderCode(orderCode).orElse(p));
    }

    @Transactional
    protected void syncAndMaybeFulfill(PaymentOrder p) {
        if (p.getSepayOrderXid() == null) {
            return;
        }
        JsonNode data;
        try {
            data = sePayApiClient.getOrder(p.getSepayOrderXid());
        } catch (Exception e) {
            return;
        }
        String s = getText(data, "status");
        if (s == null) {
            return;
        }
        if ("Paid".equalsIgnoreCase(s) && ST_PENDING.equals(p.getStatus())) {
            afterPaymentReceived(
                paymentOrderRepository.findByOrderCode(p.getOrderCode()).orElse(p)
            );
        } else if ("Cancelled".equalsIgnoreCase(s) && ST_PENDING.equals(p.getStatus())) {
            p.setStatus(ST_CANCELLED);
            paymentOrderRepository.save(p);
            paymentRealtimePublisher.publishStatusUpdate(p.getOrderCode(), ST_CANCELLED, p.getProjectId());
        } else if ("Expired".equalsIgnoreCase(s) && ST_PENDING.equals(p.getStatus())) {
            p.setStatus(ST_EXPIRED);
            paymentOrderRepository.save(p);
            paymentRealtimePublisher.publishStatusUpdate(p.getOrderCode(), ST_EXPIRED, p.getProjectId());
        }
    }

    private User getRequiredUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));
    }

    private void ensureCustomerRole(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"customer".equals(role)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ customer mới có thể tạo thanh toán cho bid", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureCustomerRoleById(long userId) {
        ensureCustomerRole(getRequiredUser(userId));
    }

    private String buildOrderCode(Bid bid) {
        return "TTB" + bid.getId() + "P" + bid.getProject().getId() + "X" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String buildDepositOrderCode(long userId) {
        return "TTD" + userId + "W" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private static String getText(JsonNode n, String field) {
        if (n == null || n.get(field) == null || n.get(field).isNull()) {
            return null;
        }
        if (n.get(field).isTextual()) {
            return n.get(field).asText();
        }
        if (n.get(field).isNumber()) {
            return n.get(field).asText();
        }
        return n.get(field).asText();
    }

    private static LocalDateTime parseSePayTime(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(s.trim(), SEPAY_TIME);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
