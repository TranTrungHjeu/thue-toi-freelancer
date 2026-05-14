package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.BidStatus;
import com.thuetoi.enums.ContractStatus;
import com.thuetoi.enums.MilestoneStatus;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.MilestoneRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class ContractService {
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

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private ContractRealtimePublisher contractRealtimePublisher;

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
        if (!ProjectStatus.OPEN.matches(project.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Project này không còn ở trạng thái mở để tạo hợp đồng", HttpStatus.BAD_REQUEST);
        }
        if (contractRepository.findByProjectId(project.getId()).isPresent()) {
            throw new BusinessException("ERR_CONTRACT_02", "Project này đã có hợp đồng", HttpStatus.CONFLICT);
        }

        User freelancer = selectedBid.getFreelancer();
        ensureFreelancer(freelancer);
        if (!BidStatus.PENDING.matches(selectedBid.getStatus()) && !BidStatus.ACCEPTED.matches(selectedBid.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể tạo hợp đồng từ bid đang chờ hoặc đã được chọn", HttpStatus.BAD_REQUEST);
        }

        List<Bid> projectBids = bidRepository.findByProjectId(project.getId());
        for (Bid currentBid : projectBids) {
            if (currentBid.getId().equals(bidId)) {
                currentBid.setStatus(BidStatus.ACCEPTED.getValue());
                continue;
            }
            if (!BidStatus.WITHDRAWN.matches(currentBid.getStatus())) {
                currentBid.setStatus(BidStatus.REJECTED.getValue());
                notificationService.createNotificationForUser(
                    currentBid.getFreelancer().getId(),
                    "bid",
                    "Bid của bạn không được chọn",
                    "Khách hàng đã chọn một bid khác cho project \"" + project.getTitle() + "\".",
                    "/workspace/projects"
                );
            }
        }
        bidRepository.saveAll(projectBids);

        project.setStatus(ProjectStatus.IN_PROGRESS.getValue());
        projectRepository.save(project);

        Contract contract = new Contract();
        contract.setProjectId(project.getId());
        contract.setFreelancerId(freelancer.getId());
        contract.setClientId(project.getUser().getId());
        contract.setTotalAmount(selectedBid.getPrice());
        contract.setProgress(0);
        contract.setStatus(ContractStatus.IN_PROGRESS.getValue());
        contract.setStartDate(LocalDateTime.now());

        Contract createdContract = contractRepository.save(contract);
        publishContractEvent(createdContract.getId(), "contract.created", createdContract);
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
        BigDecimal amount,
        LocalDateTime dueDate,
        String status
    ) {
        Contract contract = contractAccessService.requireCustomerContract(contractId, currentUserId);
        ensureContractInProgress(contract, "Chỉ có thể tạo milestone cho hợp đồng đang thực hiện");

        if (title == null || title.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề milestone không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("ERR_SYS_02", "Giá trị milestone phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }

        Milestone milestone = new Milestone();
        milestone.setContractId(contractId);
        milestone.setTitle(title.trim());
        milestone.setAmount(amount);
        milestone.setDueDate(dueDate);
        milestone.setStatus(normalizeMilestoneCreateStatus(status).getValue());
        Milestone createdMilestone = milestoneRepository.save(milestone);
        notificationService.createNotificationForUser(
            contract.getFreelancerId(),
            "contract",
            "Bạn có milestone mới",
            "Khách hàng vừa thêm milestone \"" + createdMilestone.getTitle() + "\" cho contract #" + contractId + ".",
            "/workspace/contracts"
        );
        publishContractEvent(contractId, "milestone.created", createdMilestone);
        return createdMilestone;
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
        ContractStatus currentStatus = normalizeStoredContractStatus(contract.getStatus());
        ContractStatus normalizedStatus = normalizeContractStatus(status, false);

        if (currentStatus == normalizedStatus) {
            return contract;
        }
        if (currentStatus != ContractStatus.IN_PROGRESS) {
            throw new BusinessException("ERR_SYS_02", "Không thể thay đổi hợp đồng đã ở trạng thái kết thúc", HttpStatus.BAD_REQUEST);
        }
        if (normalizedStatus == ContractStatus.IN_PROGRESS) {
            throw new BusinessException("ERR_SYS_02", "Hợp đồng đang thực hiện không cần cập nhật lại cùng trạng thái", HttpStatus.BAD_REQUEST);
        }

        contract.setStatus(normalizedStatus.getValue());
        contract.setEndDate(LocalDateTime.now());
        syncProjectStatus(contract.getProjectId(), normalizedStatus);
        Contract updatedContract = contractRepository.save(contract);
        Long counterpartUserId = contract.getClientId().equals(currentUserId)
            ? contract.getFreelancerId()
            : contract.getClientId();
        notificationService.createNotificationForUser(
            counterpartUserId,
            "contract",
            normalizedStatus == ContractStatus.COMPLETED ? "Hợp đồng đã hoàn thành" : "Hợp đồng đã bị hủy",
            "Contract #" + contractId + " vừa được cập nhật sang trạng thái \"" + normalizedStatus.getValue() + "\".",
            "/workspace/contracts"
        );

        // Tạo transaction khi hợp đồng hoàn thành theo marketplace_rules
        if (normalizedStatus == ContractStatus.COMPLETED) {
            BigDecimal amount = updatedContract.getTotalAmount() != null ? updatedContract.getTotalAmount() : BigDecimal.ZERO;
            transactionService.createTransaction(contractId, amount, "contract_completion", "completed");
        }

        publishContractEvent(contractId, "contract.status_updated", updatedContract);
        return updatedContract;
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
        if (!ContractStatus.IN_PROGRESS.matches(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", message, HttpStatus.BAD_REQUEST);
        }
    }

    private ContractStatus normalizeContractStatus(String status, boolean allowDefaultValue) {
        if (status == null || status.trim().isEmpty()) {
            if (allowDefaultValue) {
                return ContractStatus.IN_PROGRESS;
            }
            throw new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng không được để trống", HttpStatus.BAD_REQUEST);
        }
        return ContractStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng không hợp lệ", HttpStatus.BAD_REQUEST));
    }

    private ContractStatus normalizeStoredContractStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return ContractStatus.IN_PROGRESS;
        }
        return ContractStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng hiện tại không hợp lệ", HttpStatus.BAD_REQUEST));
    }

    private MilestoneStatus normalizeMilestoneStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return MilestoneStatus.PENDING;
        }
        return MilestoneStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái milestone không hợp lệ", HttpStatus.BAD_REQUEST));
    }

    private MilestoneStatus normalizeMilestoneCreateStatus(String status) {
        MilestoneStatus normalizedStatus = normalizeMilestoneStatus(status);
        if (normalizedStatus != MilestoneStatus.PENDING) {
            throw new BusinessException("ERR_SYS_02", "Milestone mới chỉ được khởi tạo ở trạng thái pending", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }

    private void syncProjectStatus(Long projectId, ContractStatus contractStatus) {
        projectRepository.findById(projectId).ifPresent(project -> {
            ProjectStatus projectStatus = ProjectStatus.fromValue(contractStatus.getValue())
                .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không thể đồng bộ trạng thái project", HttpStatus.BAD_REQUEST));
            project.setStatus(projectStatus.getValue());
            projectRepository.save(project);
        });
    }

    /**
     * Cập nhật trạng thái milestone và tạo transaction nếu hoàn thành
     */
    @Transactional
    public Milestone updateMilestoneStatus(Long milestoneId, Long currentUserId, String status) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new BusinessException("ERR_MILESTONE_01", "Không tìm thấy milestone", HttpStatus.NOT_FOUND));

        Contract contract = contractAccessService.requireCustomerContract(milestone.getContractId(), currentUserId);

        MilestoneStatus current = normalizeMilestoneStatus(milestone.getStatus());
        MilestoneStatus normalized = normalizeMilestoneStatus(status);

        if (current == normalized) {
            return milestone;
        }
        if (current != MilestoneStatus.PENDING) {
            throw new BusinessException("ERR_SYS_02", "Milestone đã ở trạng thái kết thúc không thể cập nhật lại", HttpStatus.BAD_REQUEST);
        }
        if (normalized != MilestoneStatus.PENDING) {
            ensureContractInProgress(contract, "Chỉ có thể cập nhật milestone khi contract đang tiến hành");
        }

        milestone.setStatus(normalized.getValue());
        Milestone updatedMilestone = milestoneRepository.save(milestone);

        if (normalized == MilestoneStatus.COMPLETED) {
            transactionService.createTransaction(milestone.getContractId(), milestone.getAmount(), "milestone_completion", "completed");
            notificationService.createNotificationForUser(
                contract.getFreelancerId(),
                "contract",
                "Milestone đã hoàn thành",
                "Milestone \"" + milestone.getTitle() + "\" đã được hoàn thành.",
                "/workspace/contracts"
            );
        }
        if (normalized == MilestoneStatus.CANCELLED) {
            notificationService.createNotificationForUser(
                contract.getFreelancerId(),
                "contract",
                "Milestone đã bị hủy",
                "Milestone \"" + milestone.getTitle() + "\" đã bị hủy.",
                "/workspace/contracts"
            );
        }

        publishContractEvent(contract.getId(), "milestone.status_updated", updatedMilestone);
        return updatedMilestone;
    }

    private void publishContractEvent(Long contractId, String type, Object payload) {
        if (contractRealtimePublisher == null) {
            return;
        }
        contractRealtimePublisher.publish(contractId, type, payload);
    }

    public List<com.thuetoi.entity.TransactionHistory> getTransactionsByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return transactionService.getTransactionsByContract(contractId);
    }
}
