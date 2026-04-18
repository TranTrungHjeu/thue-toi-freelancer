package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Project;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.service.AdminService;
import com.thuetoi.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller Admin: Moderation endpoints for admin role
 * Bám rules: admin oversight on projects/status per marketplace_rules.md
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private ProjectService projectService;

    /**
     * Lấy tất cả projects cho admin review
     */
    @GetMapping("/projects")
    public ApiResponse<List<Project>> getAllProjectsForModeration() {
        List<Project> projects = projectService.getAllProjects(); // or admin specific
        return ApiResponse.success("Danh sách projects cho admin", projects);
    }

    /**
     * Admin approve or reject project
     */
    @PutMapping("/projects/{projectId}/status")
    public ApiResponse<Project> updateProjectStatus(@PathVariable Long projectId, @RequestParam String status, Principal principal) {
        // Reuse patterns from ContractService for status validation and notifications
        Project updated = adminService.updateProjectStatus(projectId, status);
        return ApiResponse.success("Cập nhật status project bởi admin", updated);
    }
}
