package com.thuetoi.service;

import com.thuetoi.entity.Project;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AdminService: Moderation logic for admin role
 * Reuses ProjectService and ContractService patterns for status, notifications, ownership.
 */
@Service
public class AdminService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private NotificationService notificationService;

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
