package com.thuetoi.controller;

import com.thuetoi.dto.request.ProjectRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Project;
import com.thuetoi.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller Project: API CRUD dự án, filter, validate
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired
    private ProjectService projectService;

    /**
     * Tạo dự án mới
     */
    @PostMapping
    public ApiResponse<Project> createProject(@RequestBody ProjectRequest request) {
        Project project = projectService.createProject(request.getUserId(), request.getTitle(), request.getDescription(), request.getBudgetMin(), request.getBudgetMax(), request.getDeadline());
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
     * Lấy danh sách dự án của user
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<Project>> getProjectsByUser(@PathVariable Long userId) {
        List<Project> projects = projectService.getProjectsByUser(userId);
        return ApiResponse.success("Lấy danh sách dự án của user", projects);
    }

    /**
     * Lấy chi tiết dự án
     */
    @GetMapping("/{id}")
    public ApiResponse<Project> getProject(@PathVariable Long id) {
        return projectService.getProject(id)
                .map(project -> ApiResponse.success("Lấy chi tiết dự án thành công", project))
                .orElseGet(() -> ApiResponse.error("Không tìm thấy dự án"));
    }

    /**
     * Cập nhật dự án
     */
    @PutMapping("/{id}")
    public ApiResponse<Project> updateProject(@PathVariable Long id, @RequestBody ProjectRequest request) {
        Project project = projectService.updateProject(id, request.getTitle(), request.getDescription(), request.getBudgetMin(), request.getBudgetMax(), request.getDeadline(), request.getStatus());
        return ApiResponse.success("Cập nhật dự án thành công", project);
    }

    /**
     * Xóa dự án
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ApiResponse.success("Xóa dự án thành công", null);
    }
}
