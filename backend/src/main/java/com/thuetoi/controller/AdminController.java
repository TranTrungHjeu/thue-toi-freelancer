package com.thuetoi.controller;

import com.thuetoi.dto.request.admin.AdminBroadcastRequest;
import com.thuetoi.dto.request.admin.BulkProjectStatusRequest;
import com.thuetoi.dto.request.admin.BulkUserStatusRequest;
import com.thuetoi.dto.request.admin.SkillAdminRequest;
import com.thuetoi.dto.request.admin.UpdateSystemSettingRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.admin.AdminAuditLogResponse;
import com.thuetoi.dto.response.admin.AdminKycResponse;
import com.thuetoi.dto.response.admin.AdminProjectResponse;
import com.thuetoi.dto.response.admin.AdminReportResponse;
import com.thuetoi.dto.response.admin.AdminStatsResponse;
import com.thuetoi.dto.response.admin.AdminWithdrawalResponse;
import com.thuetoi.dto.response.admin.NotificationDeliveryLogResponse;
import com.thuetoi.dto.response.admin.SystemSettingAdminResponse;
import com.thuetoi.dto.response.admin.SystemHealthResponse;
import com.thuetoi.dto.response.admin.UserAdminResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.AdminResponseMapper;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.service.AdminService;
import com.thuetoi.service.NotificationService;
import com.thuetoi.service.NotificationDeliveryLogService;
import com.thuetoi.service.SkillService;
import com.thuetoi.service.AuditLogService;
import com.thuetoi.service.SystemHealthService;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.SystemSetting;
import com.thuetoi.entity.User;
import com.thuetoi.security.CurrentUserProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

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
    private SkillService skillService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationDeliveryLogService notificationDeliveryLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private SystemHealthService systemHealthService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private AdminResponseMapper adminResponseMapper;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    /**
     * Lấy thống kê hệ thống (GMV, User count, etc.)
     */
    @GetMapping("/stats")
    public ApiResponse<AdminStatsResponse> getSystemStats() {
        return ApiResponse.success("Thống kê hệ thống", adminService.getSystemStats());
    }

    /**
     * Theo dõi sức khỏe hệ thống chi tiết (CPU, RAM, Disk)
     */
    @GetMapping("/health-detailed")
    public ApiResponse<SystemHealthResponse> getHealthDetailed() {
        return ApiResponse.success("Trạng thái tài nguyên hệ thống", systemHealthService.getSystemHealth());
    }

    /**
     * Lấy danh sách toàn bộ người dùng cho Admin
     */
    @GetMapping("/users")
    public ApiResponse<List<UserAdminResponse>> getAllUsers() {
        return ApiResponse.success("Danh sách người dùng", adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/toggle-status")
    public ApiResponse<Void> toggleUserStatus(@PathVariable Long userId, @RequestParam(required = false) String reason, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        adminService.toggleUserStatus(userId, currentAdmin.getId(), reason);
        auditLogService.log(currentAdmin.getEmail(), "TOGGLE_USER_STATUS", "USER", userId, "Lý do: " + reason, request.getRemoteAddr());
        return ApiResponse.success("Cập nhật trạng thái người dùng thành công", null);
    }

    @PostMapping("/users/bulk-status")
    public ApiResponse<Void> bulkToggleUserStatus(@Valid @RequestBody BulkUserStatusRequest payload, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        adminService.bulkToggleUserStatus(payload.getUserIds(), payload.getActive(), payload.getReason(), currentAdmin.getId());
        auditLogService.log(currentAdmin.getEmail(), "BULK_TOGGLE_USER_STATUS", "USER", null,
            String.format("Target counts: %d, New Status: %s", payload.getUserIds().size(), payload.getActive() ? "Active" : "Locked"),
            request.getRemoteAddr());
        return ApiResponse.success("Cập nhật trạng thái hàng loạt thành công", null);
    }

    /**
     * Thay đổi vai trò người dùng
     */
    @PutMapping("/users/{userId}/role")
    public ApiResponse<Void> updateUserRole(@PathVariable Long userId, @RequestParam String role, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        adminService.updateUserRole(userId, role, currentAdmin.getId());
        auditLogService.log(currentAdmin.getEmail(), "UPDATE_USER_ROLE", "USER", userId, "Vai trò mới: " + role, request.getRemoteAddr());
        return ApiResponse.success("Cập nhật vai trò người dùng thành công", null);
    }

    /**
     * Lấy tất cả projects cho admin review
     */
    @GetMapping("/projects")
    public ApiResponse<List<AdminProjectResponse>> getAllProjectsForModeration() {
        List<Project> projects = adminService.getAllProjects();
        return ApiResponse.success("Danh sách projects cho admin", adminResponseMapper.toProjectResponses(projects));
    }

    /**
     * Admin approve or reject project
     */
    @PutMapping("/projects/{projectId}/status")
    public ApiResponse<AdminProjectResponse> updateProjectStatus(@PathVariable Long projectId, @RequestParam String status, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        // Reuse patterns from ContractService for status validation and notifications
        Project updated = adminService.updateProjectStatus(projectId, status);
        auditLogService.log(currentAdmin.getEmail(), "UPDATE_PROJECT_STATUS", "PROJECT", projectId, "Trạng thái mới: " + status, request.getRemoteAddr());
        return ApiResponse.success("Cập nhật status project bởi admin", adminResponseMapper.toProjectResponse(updated));
    }

    @PostMapping("/projects/bulk-status")
    public ApiResponse<Void> bulkUpdateProjectStatus(@Valid @RequestBody BulkProjectStatusRequest payload, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        adminService.bulkUpdateProjectStatus(payload.getProjectIds(), payload.getStatus());
        auditLogService.log(currentAdmin.getEmail(), "BULK_UPDATE_PROJECT_STATUS", "PROJECT", null,
            String.format("Target counts: %d, New Status: %s", payload.getProjectIds().size(), payload.getStatus()),
            request.getRemoteAddr());
        return ApiResponse.success("Cập nhật trạng thái dự án hàng loạt thành công", null);
    }

    // --- Skills Management ---

    @PostMapping("/skills")
    public ApiResponse<com.thuetoi.dto.response.marketplace.SkillResponse> createSkill(@Valid @RequestBody SkillAdminRequest skill) {
        return ApiResponse.success(
            "Thêm kỹ năng thành công",
            marketplaceResponseMapper.toSkillResponse(skillService.createSkill(skill.getName(), skill.getDescription()))
        );
    }

    @PutMapping("/skills/{id}")
    public ApiResponse<com.thuetoi.dto.response.marketplace.SkillResponse> updateSkill(@PathVariable Long id, @Valid @RequestBody SkillAdminRequest skill) {
        return ApiResponse.success(
            "Cập nhật kỹ năng thành công",
            marketplaceResponseMapper.toSkillResponse(skillService.updateSkill(id, skill.getName(), skill.getDescription()))
        );
    }

    @DeleteMapping("/skills/{id}")
    public ApiResponse<Void> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ApiResponse.success("Xóa kỹ năng thành công", null);
    }

    // --- Broadcast ---

    @PostMapping("/broadcast")
    public ApiResponse<Void> broadcast(@Valid @RequestBody AdminBroadcastRequest payload, Principal principal) {
        User currentAdmin = requireCurrentAdmin(principal);
        notificationService.broadcastNotification(
            payload.getTargetRole(),
            payload.getType(),
            payload.getTitle(),
            payload.getContent(),
            payload.getLink(),
            currentAdmin.getId()
        );
        return ApiResponse.success("Phát sóng thông báo thành công", null);
    }

    // --- KYC Review ---

    @GetMapping("/kyc")
    public ApiResponse<List<AdminKycResponse>> getKycRequests() {
        return ApiResponse.success("Danh sách yêu cầu KYC", adminResponseMapper.toKycResponses(adminService.getAllKycRequests()));
    }

    @PutMapping("/kyc/{id}/approve")
    public ApiResponse<AdminKycResponse> approveKyc(@PathVariable Long id) {
        return ApiResponse.success("Phê duyệt KYC thành công", adminResponseMapper.toKycResponse(adminService.approveKyc(id)));
    }

    @PutMapping("/kyc/{id}/reject")
    public ApiResponse<AdminKycResponse> rejectKyc(@PathVariable Long id, @RequestParam String reason) {
        return ApiResponse.success("Từ chối KYC thành công", adminResponseMapper.toKycResponse(adminService.rejectKyc(id, reason)));
    }

    // --- Reports Management ---

    @GetMapping("/reports")
    public ApiResponse<List<AdminReportResponse>> getReports() {
        return ApiResponse.success("Danh sách báo cáo vi phạm", adminResponseMapper.toReportResponses(adminService.getAllReports()));
    }

    @PutMapping("/reports/{id}/status")
    public ApiResponse<AdminReportResponse> updateReportStatus(@PathVariable Long id, @RequestParam String status) {
        return ApiResponse.success("Cập nhật trạng thái báo cáo thành công", adminResponseMapper.toReportResponse(adminService.updateReportStatus(id, status)));
    }

    // --- Finance & Withdrawal Management ---

    @GetMapping("/withdrawals")
    public ApiResponse<List<AdminWithdrawalResponse>> getWithdrawals() {
        return ApiResponse.success("Danh sách yêu cầu rút tiền", adminResponseMapper.toWithdrawalResponses(adminService.getAllWithdrawals()));
    }

    @PostMapping("/withdrawals/{id}/process")
    public ApiResponse<AdminWithdrawalResponse> processWithdrawal(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String note,
            Principal principal) {

        User currentAdmin = requireCurrentAdmin(principal);

        return ApiResponse.success(
            "Xử lý yêu cầu rút tiền thành công",
            adminResponseMapper.toWithdrawalResponse(adminService.processWithdrawal(id, status, note, currentAdmin.getId()))
        );
    }

    // --- System Settings ---

    @GetMapping("/settings")
    public ApiResponse<List<SystemSettingAdminResponse>> getSettings() {
        return ApiResponse.success("Cấu hình hệ thống", adminResponseMapper.toSystemSettingResponses(adminService.getSettings()));
    }

    @PostMapping("/settings")
    public ApiResponse<SystemSettingAdminResponse> updateSetting(@Valid @RequestBody UpdateSystemSettingRequest payload, Principal principal, HttpServletRequest request) {
        User currentAdmin = requireCurrentAdmin(principal);
        SystemSetting setting = adminService.updateSetting(payload.getKey(), payload.getValue());
        auditLogService.log(currentAdmin.getEmail(), "UPDATE_SYSTEM_SETTING", "SETTING", null,
            String.format("Key: %s, Value: %s", payload.getKey(), payload.getValue()), request.getRemoteAddr());
        return ApiResponse.success("Cập nhật cấu hình thành công", adminResponseMapper.toSystemSettingResponse(setting));
    }

    /**
     * Lấy toàn bộ nhật ký hệ thống
     */
    @GetMapping("/logs")
    public ApiResponse<List<AdminAuditLogResponse>> getAuditLogs() {
        return ApiResponse.success("Nhật ký hệ thống", adminResponseMapper.toAuditLogResponses(auditLogService.getAllLogs()));
    }

    @GetMapping("/notifications/delivery-logs")
    public ApiResponse<List<NotificationDeliveryLogResponse>> getNotificationDeliveryLogs() {
        return ApiResponse.success("Nhật ký gửi thông báo", notificationDeliveryLogService.getRecentLogs());
    }

    private User requireCurrentAdmin(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        return userRepository.findById(currentUserId)
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "Admin not found", HttpStatus.NOT_FOUND));
    }
}
