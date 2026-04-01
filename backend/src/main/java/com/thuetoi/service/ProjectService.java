package com.thuetoi.service;

import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Service Project: Xử lý logic nghiệp vụ dự án
 */
@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;

    /**
     * Lấy tất cả dự án
     */
    public List<Project> getAllProjects() {
        return projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN.getValue());
    }

    @Autowired
    private UserRepository userRepository;

    /**
     * Tạo dự án mới
     */
    @Transactional
    public Project createProject(Long userId, String title, String description, BigDecimal budgetMin, BigDecimal budgetMax, LocalDateTime deadline) {
        User user = getRequiredUser(userId);
        ensureCustomer(user);
        validateProjectPayload(title, budgetMin != null ? budgetMin.doubleValue() : null, budgetMax != null ? budgetMax.doubleValue() : null);

        Project project = new Project();
        project.setUser(user);
        project.setTitle(title.trim());
        project.setDescription(normalizeText(description));
        project.setBudgetMin(budgetMin);
        project.setBudgetMax(budgetMax);
        project.setDeadline(deadline);
        project.setStatus(ProjectStatus.OPEN.getValue());
        return projectRepository.save(project);
    }

    /**
     * Lấy danh sách dự án theo status
     */
    public List<Project> getProjectsByStatus(String status) {
        ProjectStatus normalizedStatus = ProjectStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái dự án không hợp lệ", HttpStatus.BAD_REQUEST));
        return projectRepository.findByStatus(normalizedStatus.getValue());
    }

    /**
     * Lấy danh sách dự án của user
     */
    public List<Project> getProjectsByUser(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Lấy chi tiết dự án
     */
    public Optional<Project> getProject(Long id) {
        return projectRepository.findById(id);
    }

    /**
     * Cập nhật dự án
     */
    @Transactional
    public Project updateProject(Long id, Long userId, String title, String description, BigDecimal budgetMin, BigDecimal budgetMax, LocalDateTime deadline, String status) {
        Project project = getOwnedProject(id, userId);
        validateProjectPayload(title, budgetMin != null ? budgetMin.doubleValue() : null, budgetMax != null ? budgetMax.doubleValue() : null);

        project.setTitle(title.trim());
        project.setDescription(normalizeText(description));
        project.setBudgetMin(budgetMin);
        project.setBudgetMax(budgetMax);
        project.setDeadline(deadline);
        project.setStatus(normalizeStatus(status, project.getStatus()));
        return projectRepository.save(project);
    }

    /**
     * Xóa dự án
     */
    @Transactional
    public void deleteProject(Long id, Long userId) {
        Project project = getOwnedProject(id, userId);
        projectRepository.delete(project);
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED));
    }

    private Project getOwnedProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        if (!project.getUser().getId().equals(userId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền thao tác dự án này", HttpStatus.FORBIDDEN);
        }
        ensureCustomer(project.getUser());
        return project;
    }

    private void ensureCustomer(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toLowerCase(Locale.ROOT);
        if (!"customer".equals(role)) {
            throw new BusinessException("ERR_AUTH_04", "Chỉ customer mới có thể quản lý dự án", HttpStatus.FORBIDDEN);
        }
    }

    private void validateProjectPayload(String title, Double budgetMin, Double budgetMax) {
        if (title == null || title.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề dự án không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (budgetMin == null || budgetMax == null) {
            throw new BusinessException("ERR_SYS_02", "Ngân sách dự án không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (budgetMin < 0 || budgetMax < 0) {
            throw new BusinessException("ERR_SYS_02", "Ngân sách dự án không được âm", HttpStatus.BAD_REQUEST);
        }
        if (budgetMin > budgetMax) {
            throw new BusinessException("ERR_SYS_02", "Ngân sách tối thiểu không được lớn hơn ngân sách tối đa", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeStatus(String status, String fallbackStatus) {
        if (status == null || status.trim().isEmpty()) {
            return fallbackStatus;
        }
        ProjectStatus normalizedStatus = ProjectStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái dự án không hợp lệ", HttpStatus.BAD_REQUEST));
        if (normalizedStatus == ProjectStatus.IN_PROGRESS || normalizedStatus == ProjectStatus.COMPLETED) {
            throw new BusinessException(
                "ERR_SYS_02",
                "Trạng thái in_progress và completed được quản lý bởi luồng hợp đồng, không cập nhật thủ công",
                HttpStatus.BAD_REQUEST
            );
        }
        return normalizedStatus.getValue();
    }

    /**
     * Tìm kiếm project theo kỹ năng (skill-based search)
     */
    public List<Project> searchProjectsBySkills(List<String> skillNames, String status) {
        if (skillNames == null || skillNames.isEmpty()) {
            return getProjectsByStatus(status != null ? status : "open");
        }
        List<String> normalizedSkills = skillNames.stream()
            .map(s -> s.trim().toLowerCase())
            .filter(s -> !s.isEmpty())
            .toList();
        if (normalizedSkills.isEmpty()) {
            return getProjectsByStatus(status != null ? status : "open");
        }
        return projectRepository.findDistinctBySkillsNameIn(normalizedSkills);
    }
}

