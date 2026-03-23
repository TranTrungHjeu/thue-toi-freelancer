package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Service Bid: Xử lý logic nghiệp vụ báo giá
 */
@Service
public class BidService {
    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Lấy toàn bộ bid mà user hiện tại được phép xem
     */
    public List<Bid> getAllBids(Long userId) {
        User currentUser = getRequiredUser(userId);
        if ("customer".equalsIgnoreCase(currentUser.getRole())) {
            return bidRepository.findByProjectUserIdOrderByCreatedAtDesc(userId);
        }
        return bidRepository.findByFreelancerIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Freelancer gửi báo giá cho dự án
     */
    @Transactional
    public Bid createBid(Long projectId, Long freelancerId, Double price, String message, String estimatedTime, String attachments) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        User freelancer = getRequiredUser(freelancerId);

        ensureFreelancer(freelancer);
        if (!"open".equalsIgnoreCase(project.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể gửi bid cho project đang mở", HttpStatus.BAD_REQUEST);
        }
        if (project.getUser().getId().equals(freelancerId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không thể gửi bid cho chính project của mình", HttpStatus.FORBIDDEN);
        }
        validateBidPayload(price);

        Bid bid = new Bid();
        bid.setProject(project);
        bid.setFreelancer(freelancer);
        bid.setPrice(price);
        bid.setMessage(normalizeText(message));
        bid.setEstimatedTime(normalizeText(estimatedTime));
        bid.setAttachments(normalizeText(attachments));
        bid.setStatus("pending");
        return bidRepository.save(bid);
    }

    /**
     * Lấy danh sách bid theo dự án
     */
    public List<Bid> getBidsByProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        ensureProjectOwner(project, userId);
        return bidRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    /**
     * Lấy danh sách bid của freelancer
     */
    public List<Bid> getBidsByFreelancer(Long freelancerId, Long currentUserId) {
        if (!freelancerId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem danh sách bid của người khác", HttpStatus.FORBIDDEN);
        }
        getRequiredUser(currentUserId);
        return bidRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId);
    }

    /**
     * Chọn bid (customer accept)
     */
    @Transactional
    public Bid acceptBid(Long bidId, Long currentUserId) {
        Bid bid = getRequiredBid(bidId);
        Project project = bid.getProject();

        ensureProjectOwner(project, currentUserId);
        if (!"open".equalsIgnoreCase(project.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Project này không còn ở trạng thái mở để chấp nhận bid", HttpStatus.BAD_REQUEST);
        }
        if (contractRepository.findByProjectId(project.getId()).isPresent()) {
            throw new BusinessException("ERR_CONTRACT_02", "Project này đã có hợp đồng", HttpStatus.CONFLICT);
        }

        List<Bid> projectBids = bidRepository.findByProjectId(project.getId());
        Bid acceptedBid = bid;
        for (Bid currentBid : projectBids) {
            if (currentBid.getId().equals(bidId)) {
                currentBid.setStatus("accepted");
                acceptedBid = currentBid;
            } else {
                currentBid.setStatus("rejected");
            }
        }
        bidRepository.saveAll(projectBids);

        project.setStatus("in_progress");
        projectRepository.save(project);

        Contract contract = new Contract();
        contract.setProjectId(project.getId());
        contract.setFreelancerId(acceptedBid.getFreelancer().getId());
        contract.setClientId(project.getUser().getId());
        contract.setTotalAmount(acceptedBid.getPrice());
        contract.setProgress(0);
        contract.setStatus("in_progress");
        contract.setStartDate(LocalDateTime.now());
        contractRepository.save(contract);

        notificationService.createNotificationForUser(
            acceptedBid.getFreelancer().getId(),
            "contract",
            "Bid của bạn đã được chấp nhận",
            "Khách hàng đã chấp nhận báo giá cho project \"" + project.getTitle() + "\".",
            "/workspace/contracts"
        );

        return acceptedBid;
    }

    /**
     * Cập nhật trạng thái bid
     */
    @Transactional
    public Bid updateBidStatus(Long bidId, Long currentUserId, String status) {
        Bid bid = getRequiredBid(bidId);
        boolean isBidOwner = bid.getFreelancer().getId().equals(currentUserId);
        boolean isProjectOwner = bid.getProject().getUser().getId().equals(currentUserId);
        if (!isBidOwner && !isProjectOwner) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền cập nhật bid này", HttpStatus.FORBIDDEN);
        }
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái bid không được để trống", HttpStatus.BAD_REQUEST);
        }
        bid.setStatus(status.trim().toLowerCase(Locale.ROOT));
        return bidRepository.save(bid);
    }

    /**
     * Lấy chi tiết bid
     */
    public Optional<Bid> getBid(Long id, Long currentUserId) {
        Bid bid = getRequiredBid(id);
        boolean isBidOwner = bid.getFreelancer().getId().equals(currentUserId);
        boolean isProjectOwner = bid.getProject().getUser().getId().equals(currentUserId);
        if (!isBidOwner && !isProjectOwner) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem bid này", HttpStatus.FORBIDDEN);
        }
        return Optional.of(bid);
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));
    }

    private Bid getRequiredBid(Long bidId) {
        return bidRepository.findById(bidId)
            .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));
    }

    private void ensureProjectOwner(Project project, Long currentUserId) {
        if (!project.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền thao tác bid của project này", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureFreelancer(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"freelancer".equals(role)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ freelancer mới có thể gửi bid", HttpStatus.FORBIDDEN);
        }
    }

    private void validateBidPayload(Double price) {
        if (price == null || price <= 0) {
            throw new BusinessException("ERR_SYS_02", "Giá đề xuất phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
