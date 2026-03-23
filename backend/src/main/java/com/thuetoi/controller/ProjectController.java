package com.thuetoi.controller;

import com.thuetoi.dto.request.ProjectRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Project;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller Project: API CRUD dự án, filter, validate
 */
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    @Autowired
    private ProjectService projectService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    /**
     * Lấy tất cả dự án đang mở trên marketplace
     */
    @GetMapping
    public ApiResponse<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        return ApiResponse.success("Lấy tất cả dự án", projects);
    }

    /**
     * Tạo dự án mới
     */
    @PostMapping
    public ApiResponse<Project> createProject(@Valid @RequestBody ProjectRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Project project = projectService.createProject(
            currentUserId,
            request.getTitle(),
            request.getDescription(),
            request.getBudgetMin(),
            request.getBudgetMax(),
            request.getDeadline()
        );
        return ApiResponse.success("Tạo dự án thành công", project);
    }

    /**
     * Lấy danh sách dự án theo status
     */
    @GetMapping("/status/{status}")
    public ApiResponse<List<Project>> getProjectsByStatus(@PathVariable String status) {
        List<Project> projects = projectService.getProjectsByStatus(status);
        return ApiResponse.success("Lấy danh sách dự án theo trạng thái", projects);
    }

    /**
     * Lấy danh sách dự án của user hiện tại
     */
    @GetMapping("/my")
    public ApiResponse<List<Project>> getMyProjects(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Project> projects = projectService.getProjectsByUser(currentUserId);
        return ApiResponse.success("Lấy danh sách dự án của user hiện tại", projects);
    }

    /**
     * Lấy danh sách dự án của user
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<Project>> getProjectsByUser(@PathVariable Long userId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        if (!userId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem dự án của người dùng khác", HttpStatus.FORBIDDEN);
        }
        List<Project> projects = projectService.getProjectsByUser(userId);
        return ApiResponse.success("Lấy danh sách dự án của user", projects);
    }

    /**
     * Lấy chi tiết dự án
     */
    @GetMapping("/{id}")
    public ApiResponse<Project> getProject(@PathVariable Long id) {
        Project project = projectService.getProject(id)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Không tìm thấy dự án", HttpStatus.NOT_FOUND));
        return ApiResponse.success("Lấy chi tiết dự án thành công", project);
    }

    /**
     * Cập nhật dự án
     */
    @PutMapping("/{id}")
    public ApiResponse<Project> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Project project = projectService.updateProject(
            id,
            currentUserId,
            request.getTitle(),
            request.getDescription(),
            request.getBudgetMin(),
            request.getBudgetMax(),
            request.getDeadline(),
            request.getStatus()
        );
        return ApiResponse.success("Cập nhật dự án thành công", project);
    }

    /**
     * Xóa dự án
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        projectService.deleteProject(id, currentUserId);
        return ApiResponse.success("Xóa dự án thành công", null);
    }
}
