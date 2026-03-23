package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.MilestoneRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ContractService {
    private static final Set<String> ALLOWED_CONTRACT_STATUSES = Set.of("in_progress", "completed", "cancelled");
    private static final Set<String> ALLOWED_MILESTONE_STATUSES = Set.of("pending", "completed", "cancelled");

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ContractAccessService contractAccessService;

    /**
     * Lấy tất cả hợp đồng mà user hiện tại được phép xem.
     */
    public List<Contract> getAllContracts(Long userId) {
        return getContractsByUser(userId);
    }

    /**
     * Tạo hợp đồng từ bid đã được customer chọn.
     */
    @Transactional
    public Contract createContractFromBid(Long currentUserId, Long bidId) {
        User customer = getRequiredUser(currentUserId);
        ensureCustomer(customer);

        Bid selectedBid = bidRepository.findById(bidId)
            .orElseThrow(() -> new BusinessException("ERR_BID_01", "Không tìm thấy báo giá", HttpStatus.NOT_FOUND));

        Project project = selectedBid.getProject();
        if (!project.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền tạo hợp đồng cho project này", HttpStatus.FORBIDDEN);
        }
        if (!"open".equalsIgnoreCase(project.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Project này không còn ở trạng thái mở để tạo hợp đồng", HttpStatus.BAD_REQUEST);
        }
        if (contractRepository.findByProjectId(project.getId()).isPresent()) {
            throw new BusinessException("ERR_CONTRACT_02", "Project này đã có hợp đồng", HttpStatus.CONFLICT);
        }

        User freelancer = selectedBid.getFreelancer();
        ensureFreelancer(freelancer);
        if (!"pending".equalsIgnoreCase(selectedBid.getStatus()) && !"accepted".equalsIgnoreCase(selectedBid.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể tạo hợp đồng từ bid đang chờ hoặc đã được chọn", HttpStatus.BAD_REQUEST);
        }

        List<Bid> projectBids = bidRepository.findByProjectId(project.getId());
        for (Bid currentBid : projectBids) {
            if (currentBid.getId().equals(bidId)) {
                currentBid.setStatus("accepted");
                continue;
            }
            if (!"withdrawn".equalsIgnoreCase(currentBid.getStatus())) {
                currentBid.setStatus("rejected");
            }
        }
        bidRepository.saveAll(projectBids);

        project.setStatus("in_progress");
        projectRepository.save(project);

        Contract contract = new Contract();
        contract.setProjectId(project.getId());
        contract.setFreelancerId(freelancer.getId());
        contract.setClientId(project.getUser().getId());
        contract.setTotalAmount(selectedBid.getPrice());
        contract.setProgress(0);
        contract.setStatus("in_progress");
        contract.setStartDate(LocalDateTime.now());

        Contract createdContract = contractRepository.save(contract);
        notificationService.createNotificationForUser(
            freelancer.getId(),
            "contract",
            "Bạn có hợp đồng mới",
            "Khách hàng đã chấp nhận bid của bạn cho project \"" + project.getTitle() + "\".",
            "/workspace/contracts"
        );
        return createdContract;
    }

    public List<Contract> getContractsByUser(Long userId) {
        getRequiredUser(userId);
        return contractRepository.findByClientIdOrFreelancerId(userId, userId);
    }

    @Transactional
    public Milestone addMilestone(
        Long contractId,
        Long currentUserId,
        String title,
        Double amount,
        LocalDateTime dueDate,
        String status
    ) {
        Contract contract = contractAccessService.requireCustomerContract(contractId, currentUserId);
        ensureContractInProgress(contract, "Chỉ có thể tạo milestone cho hợp đồng đang thực hiện");

        if (title == null || title.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề milestone không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (amount == null || amount <= 0) {
            throw new BusinessException("ERR_SYS_02", "Giá trị milestone phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }

        Milestone milestone = new Milestone();
        milestone.setContractId(contractId);
        milestone.setTitle(title.trim());
        milestone.setAmount(amount);
        milestone.setDueDate(dueDate);
        milestone.setStatus(normalizeMilestoneStatus(status));
        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getMilestonesByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return milestoneRepository.findByContractIdOrderByDueDateAsc(contractId);
    }

    public List<Milestone> getMilestonesByUser(Long currentUserId) {
        List<Contract> contracts = getContractsByUser(currentUserId);
        if (contracts.isEmpty()) {
            return List.of();
        }
        List<Long> contractIds = contracts.stream().map(Contract::getId).toList();
        return milestoneRepository.findByContractIdInOrderByDueDateAsc(contractIds);
    }

    @Transactional
    public Contract updateContractStatus(Long contractId, Long currentUserId, String status) {
        Contract contract = contractAccessService.requireAccessibleContract(contractId, currentUserId);
        String currentStatus = normalizeStoredContractStatus(contract.getStatus());
        String normalizedStatus = normalizeContractStatus(status, false);

        if (currentStatus.equals(normalizedStatus)) {
            return contract;
        }
        if (!"in_progress".equals(currentStatus)) {
            throw new BusinessException("ERR_SYS_02", "Không thể thay đổi hợp đồng đã ở trạng thái kết thúc", HttpStatus.BAD_REQUEST);
        }
        if ("in_progress".equals(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Hợp đồng đang thực hiện không cần cập nhật lại cùng trạng thái", HttpStatus.BAD_REQUEST);
        }

        contract.setStatus(normalizedStatus);
        contract.setEndDate(LocalDateTime.now());
        syncProjectStatus(contract.getProjectId(), normalizedStatus);
        return contractRepository.save(contract);
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));
    }

    private void ensureCustomer(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"customer".equals(role)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ customer mới có thể tạo hợp đồng", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureFreelancer(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"freelancer".equals(role)) {
            throw new BusinessException("ERR_SYS_02", "Freelancer của hợp đồng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
    }

    private void ensureContractInProgress(Contract contract, String message) {
        if (!"in_progress".equalsIgnoreCase(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", message, HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeContractStatus(String status, boolean allowDefaultValue) {
        if (status == null || status.trim().isEmpty()) {
            if (allowDefaultValue) {
                return "in_progress";
            }
            throw new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng không được để trống", HttpStatus.BAD_REQUEST);
        }

        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTRACT_STATUSES.contains(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }

    private String normalizeStoredContractStatus(String status) {
        return status == null ? "in_progress" : status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeMilestoneStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "pending";
        }

        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_MILESTONE_STATUSES.contains(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái milestone không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }

    private void syncProjectStatus(Long projectId, String contractStatus) {
        projectRepository.findById(projectId).ifPresent(project -> {
            project.setStatus(contractStatus);
            projectRepository.save(project);
        });
    }
}
