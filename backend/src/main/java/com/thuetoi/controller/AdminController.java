package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.admin.AdminStatsResponse;
import com.thuetoi.dto.response.admin.UserAdminResponse;
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
     * Lấy thống kê hệ thống (GMV, User count, etc.)
     */
    @GetMapping("/stats")
    public ApiResponse<AdminStatsResponse> getSystemStats() {
        return ApiResponse.success("Thống kê hệ thống", adminService.getSystemStats());
    }

    /**
     * Lấy danh sách toàn bộ người dùng cho Admin
     */
    @GetMapping("/users")
    public ApiResponse<List<UserAdminResponse>> getAllUsers() {
        return ApiResponse.success("Danh sách người dùng", adminService.getAllUsers());
    }

    /**
     * Khóa hoặc mở khóa tài khoản người dùng
     */
    @PutMapping("/users/{userId}/toggle-status")
    public ApiResponse<Void> toggleUserStatus(@PathVariable Long userId, @RequestParam(required = false) String reason) {
        adminService.toggleUserStatus(userId, reason);
        return ApiResponse.success("Cập nhật trạng thái người dùng thành công", null);
    }

    /**
     * Lấy tất cả projects cho admin review
     */
    @GetMapping("/projects")
    public ApiResponse<List<Project>> getAllProjectsForModeration() {
        List<Project> projects = adminService.getAllProjects();
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
