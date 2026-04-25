package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.ContractStatus;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

@Service
public class FileAccessService {
    private static final Set<String> SUPPORTED_CONTEXTS = Set.of("projects", "bids", "messages");

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ContractAccessService contractAccessService;

    public FileAccessService(
        UserRepository userRepository,
        ProjectRepository projectRepository,
        ContractAccessService contractAccessService
    ) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.contractAccessService = contractAccessService;
    }

    public String requireUploadAccess(String context, Long currentUserId, Long projectId, Long contractId) {
        String normalizedContext = normalizeContext(context);
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));

        switch (normalizedContext) {
            case "projects" -> requireProjectUploadAccess(currentUser, projectId);
            case "bids" -> requireBidUploadAccess(currentUser, projectId);
            case "messages" -> requireMessageUploadAccess(currentUserId, contractId);
            default -> throw new BusinessException("ERR_FILE_03", "Ngữ cảnh upload không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        return normalizedContext;
    }

    private String normalizeContext(String context) {
        String normalizedContext = context == null ? "" : context.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_CONTEXTS.contains(normalizedContext)) {
            throw new BusinessException("ERR_FILE_03", "Ngữ cảnh upload không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedContext;
    }

    private void requireProjectUploadAccess(User currentUser, Long projectId) {
        ensureRole(currentUser, "customer", "Chỉ Khách hàng mới được tải tệp cho project");
        if (projectId == null) {
            return;
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        if (!project.getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền tải tệp cho project này", HttpStatus.FORBIDDEN);
        }
    }

    private void requireBidUploadAccess(User currentUser, Long projectId) {
        ensureRole(currentUser, "freelancer", "Chỉ Freelancer mới được tải tệp cho báo giá");
        if (projectId == null) {
            throw new BusinessException("ERR_FILE_01", "projectId là bắt buộc khi tải tệp cho báo giá", HttpStatus.BAD_REQUEST);
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        if (!ProjectStatus.OPEN.matches(project.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể tải tệp cho project đang mở", HttpStatus.BAD_REQUEST);
        }
        if (project.getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không thể tải tệp báo giá cho project của chính mình", HttpStatus.FORBIDDEN);
        }
    }

    private void requireMessageUploadAccess(Long currentUserId, Long contractId) {
        if (contractId == null) {
            throw new BusinessException("ERR_FILE_01", "contractId là bắt buộc khi tải tệp cho tin nhắn", HttpStatus.BAD_REQUEST);
        }

        Contract contract = contractAccessService.requireAccessibleContract(contractId, currentUserId);
        if (!ContractStatus.IN_PROGRESS.matches(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể tải tệp trong hợp đồng đang thực hiện", HttpStatus.BAD_REQUEST);
        }
    }

    private void ensureRole(User user, String requiredRole, String message) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!requiredRole.equals(role)) {
            throw new BusinessException("ERR_AUTH_04", message, HttpStatus.FORBIDDEN);
        }
    }
}
