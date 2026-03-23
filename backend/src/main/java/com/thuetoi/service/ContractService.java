package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
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
    private NotificationService notificationService;

    /**
     * Lấy tất cả hợp đồng
     */
    public List<Contract> getAllContracts(Long userId) {
        return getContractsByUser(userId);
    }

    @Transactional
    public Contract createContract(Long currentUserId, Contract contract) {
        User customer = getRequiredUser(currentUserId);
        ensureCustomer(customer);
        validateContractPayload(contract);
        if (!currentUserId.equals(contract.getClientId())) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền tạo hợp đồng cho người dùng khác", HttpStatus.FORBIDDEN);
        }

        Project project = projectRepository.findById(contract.getProjectId())
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        if (!project.getUser().getId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền tạo hợp đồng cho project này", HttpStatus.FORBIDDEN);
        }
        if (contractRepository.findByProjectId(contract.getProjectId()).isPresent()) {
            throw new BusinessException("ERR_CONTRACT_02", "Project này đã có hợp đồng", HttpStatus.CONFLICT);
        }

        User freelancer = getRequiredUser(contract.getFreelancerId());
        ensureFreelancer(freelancer);

        contract.setStatus(normalizeContractStatus(contract.getStatus()));
        contract.setProgress(contract.getProgress() == null ? 0 : contract.getProgress());
        if (contract.getStartDate() == null) {
            contract.setStartDate(LocalDateTime.now());
        }

        project.setStatus("in_progress");
        projectRepository.save(project);

        Contract createdContract = contractRepository.save(contract);
        notificationService.createNotificationForUser(
            freelancer.getId(),
            "contract",
            "Bạn có hợp đồng mới",
            "Một hợp đồng mới đã được tạo cho project \"" + project.getTitle() + "\".",
            "/workspace/contracts"
        );
        return createdContract;
    }

    public List<Contract> getContractsByUser(Long userId) {
        getRequiredUser(userId);
        return contractRepository.findByClientIdOrFreelancerId(userId, userId);
    }

    @Transactional
    public Milestone addMilestone(Milestone milestone, Long currentUserId) {
        Contract contract = getAccessibleContract(milestone.getContractId(), currentUserId);
        if (!contract.getClientId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ customer của hợp đồng mới có thể tạo milestone", HttpStatus.FORBIDDEN);
        }
        if (milestone.getTitle() == null || milestone.getTitle().trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề milestone không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (milestone.getAmount() == null || milestone.getAmount() <= 0) {
            throw new BusinessException("ERR_SYS_02", "Giá trị milestone phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }
        milestone.setTitle(milestone.getTitle().trim());
        milestone.setStatus(normalizeMilestoneStatus(milestone.getStatus()));
        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getMilestonesByContract(Long contractId, Long currentUserId) {
        getAccessibleContract(contractId, currentUserId);
        return milestoneRepository.findByContractId(contractId);
    }

    @Transactional
    public Contract updateContractStatus(Long contractId, Long currentUserId, String status) {
        Contract contract = getAccessibleContract(contractId, currentUserId);
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái hợp đồng không được để trống", HttpStatus.BAD_REQUEST);
        }
        contract.setStatus(status.trim().toLowerCase(Locale.ROOT));
        if ("completed".equalsIgnoreCase(contract.getStatus()) || "cancelled".equalsIgnoreCase(contract.getStatus())) {
            contract.setEndDate(LocalDateTime.now());
        }
        return contractRepository.save(contract);
    }

    private Contract getAccessibleContract(Long contractId, Long currentUserId) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new BusinessException("ERR_CONTRACT_01", "Không tìm thấy hợp đồng", HttpStatus.NOT_FOUND));
        if (!contract.getClientId().equals(currentUserId) && !contract.getFreelancerId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền truy cập hợp đồng này", HttpStatus.FORBIDDEN);
        }
        return contract;
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));
    }

    private void validateContractPayload(Contract contract) {
        if (contract.getProjectId() == null || contract.getFreelancerId() == null || contract.getClientId() == null) {
            throw new BusinessException("ERR_SYS_02", "Thiếu thông tin bắt buộc để tạo hợp đồng", HttpStatus.BAD_REQUEST);
        }
        if (contract.getTotalAmount() == null || contract.getTotalAmount() <= 0) {
            throw new BusinessException("ERR_SYS_02", "Giá trị hợp đồng phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }
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

    private String normalizeContractStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "in_progress";
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeMilestoneStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "pending";
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }
}
