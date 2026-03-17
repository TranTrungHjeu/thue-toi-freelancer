package com.thuetoi.service;

import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * Service Project: Xử lý logic nghiệp vụ dự án
 */
@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tạo dự án mới
     */
    public Project createProject(Long userId, String title, String description, Double budgetMin, Double budgetMax, Date deadline) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập"));
        Project project = new Project();
        project.setUser(user);
        project.setTitle(title);
        project.setDescription(description);
        project.setBudgetMin(budgetMin);
        project.setBudgetMax(budgetMax);
        project.setDeadline(deadline);
        project.setStatus("open");
        return projectRepository.save(project);
    }

    /**
     * Lấy danh sách dự án theo status
     */
    public List<Project> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status);
    }

    /**
     * Lấy danh sách dự án của user
     */
    public List<Project> getProjectsByUser(Long userId) {
        return projectRepository.findByUserId(userId);
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
    public Project updateProject(Long id, String title, String description, Double budgetMin, Double budgetMax, Date deadline, String status) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án"));
        project.setTitle(title);
        project.setDescription(description);
        project.setBudgetMin(budgetMin);
        project.setBudgetMax(budgetMax);
        project.setDeadline(deadline);
        project.setStatus(status);
        return projectRepository.save(project);
    }

    /**
     * Xóa dự án
     */
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án");
        }
        projectRepository.deleteById(id);
    }
}
