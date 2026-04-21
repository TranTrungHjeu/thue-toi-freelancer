package com.thuetoi.service;

import com.thuetoi.dto.response.admin.AdminStatsResponse;
import com.thuetoi.dto.response.admin.UserAdminResponse;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.*;
import com.thuetoi.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * AdminService: Moderation logic for admin role
 * Reuses ProjectService and ContractService patterns for status, notifications, ownership.
 */
@Service
public class AdminService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private NotificationService notificationService;

    @Transactional(readOnly = true)
    public AdminStatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long totalFreelancers = userRepository.countByRole("freelancer");
        long totalCustomers = userRepository.countByRole("customer");
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.IN_PROGRESS.getValue());
        long completedContracts = contractRepository.countByStatus("completed");
        double totalGmv = contractRepository.calculateTotalGmv();

        // Matching Rate: proportion of projects that have at least one contract
        // Simple approximation: total projects / contracts ratio (capped at 100%)
        long totalContracts = contractRepository.count();
        double matchingRate = totalProjects > 0 ? Math.min(100.0, (double) totalContracts / totalProjects * 100.0) : 0.0;

        return AdminStatsResponse.builder()
            .totalUsers(totalUsers)
            .totalFreelancers(totalFreelancers)
            .totalCustomers(totalCustomers)
            .totalProjects(totalProjects)
            .activeProjects(activeProjects)
            .completedContracts(completedContracts)
            .totalGmv(totalGmv)
            .matchingRate(matchingRate)
            .build();
    }

    @Transactional(readOnly = true)
    public List<UserAdminResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            Set<String> screenSkills = user.getSkills().stream()
                .map(s -> s.getName())
                .collect(Collectors.toSet());

            return UserAdminResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .verified(user.getVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .skills(screenSkills)
                .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void toggleUserStatus(Long userId, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "User not found", HttpStatus.NOT_FOUND));

        boolean newStatus = !user.getIsActive();
        user.setIsActive(newStatus);
        userRepository.save(user);

        // Send notification/email
        String statusText = newStatus ? "kích hoạt lại" : "tạm khóa";
        notificationService.createNotificationForUser(
            user.getId(),
            "system",
            "Trạng thái tài khoản thay đổi",
            "Tài khoản của bạn đã được " + statusText + " bởi quản trị viên. Lý do: " + (reason != null ? reason : "Vi phạm chính sách hệ thống."),
            "/workspace/profile"
        );
    }

    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Project updateProjectStatus(Long projectId, String status) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Project not found", HttpStatus.NOT_FOUND));

        ProjectStatus normalizedStatus = ProjectStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái project không hợp lệ", HttpStatus.BAD_REQUEST));

        project.setStatus(normalizedStatus.getValue());
        Project saved = projectRepository.save(project);

        // Notify owner
        notificationService.createNotificationForUser(
            project.getUser().getId(), "system", "Project status updated by admin", "Status: " + normalizedStatus.getValue(), "/projects/" + projectId);

        return saved;
    }
}
