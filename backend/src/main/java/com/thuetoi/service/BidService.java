package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Service Bid: Xử lý logic nghiệp vụ báo giá.
 */
@Service
public class BidService {
    private static final Set<String> ALLOWED_BID_STATUSES = Set.of("pending", "accepted", "rejected", "withdrawn");

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractService contractService;

    /**
     * Lấy toàn bộ bid mà user hiện tại được phép xem.
     */
    public List<Bid> getAllBids(Long userId) {
        User currentUser = getRequiredUser(userId);
        if ("customer".equalsIgnoreCase(currentUser.getRole())) {
            return bidRepository.findByProjectUserIdOrderByCreatedAtDesc(userId);
        }
        return bidRepository.findByFreelancerIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Freelancer gửi báo giá cho dự án.
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
     * Lấy danh sách bid theo dự án.
     */
    public List<Bid> getBidsByProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        ensureProjectOwner(project, userId);
        return bidRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    /**
     * Lấy danh sách bid của freelancer.
     */
    public List<Bid> getBidsByFreelancer(Long freelancerId, Long currentUserId) {
        if (!freelancerId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem danh sách bid của người khác", HttpStatus.FORBIDDEN);
        }
        getRequiredUser(currentUserId);
        return bidRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId);
    }

    /**
     * Chọn bid (customer accept) và tạo hợp đồng theo luồng chuẩn.
     */
    @Transactional
    public Bid acceptBid(Long bidId, Long currentUserId) {
        contractService.createContractFromBid(currentUserId, bidId);
        return getRequiredBid(bidId);
    }

    /**
     * Cập nhật trạng thái bid theo đúng quyền sở hữu.
     */
    @Transactional
    public Bid updateBidStatus(Long bidId, Long currentUserId, String status) {
        Bid bid = getRequiredBid(bidId);
        boolean isBidOwner = bid.getFreelancer().getId().equals(currentUserId);
        boolean isProjectOwner = bid.getProject().getUser().getId().equals(currentUserId);

        if (!isBidOwner && !isProjectOwner) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền cập nhật bid này", HttpStatus.FORBIDDEN);
        }

        String normalizedStatus = normalizeBidStatus(status);
        if ("accepted".equals(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Bid chỉ có thể được chấp nhận qua endpoint accept", HttpStatus.BAD_REQUEST);
        }
        if (!"pending".equalsIgnoreCase(bid.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ bid đang chờ mới được cập nhật trạng thái thủ công", HttpStatus.BAD_REQUEST);
        }

        if (isBidOwner) {
            if (!"withdrawn".equals(normalizedStatus)) {
                throw new BusinessException("ERR_AUTH_04", "Freelancer chỉ có thể rút bid của mình", HttpStatus.FORBIDDEN);
            }
            bid.setStatus("withdrawn");
            return bidRepository.save(bid);
        }

        if (!"rejected".equals(normalizedStatus)) {
            throw new BusinessException("ERR_AUTH_04", "Customer chỉ có thể từ chối bid qua endpoint cập nhật trạng thái", HttpStatus.FORBIDDEN);
        }

        bid.setStatus("rejected");
        return bidRepository.save(bid);
    }

    /**
     * Lấy chi tiết bid.
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

    private String normalizeBidStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái bid không được để trống", HttpStatus.BAD_REQUEST);
        }
        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_BID_STATUSES.contains(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái bid không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }
}
