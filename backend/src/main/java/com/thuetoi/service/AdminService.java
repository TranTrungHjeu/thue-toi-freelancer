package com.thuetoi.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.thuetoi.dto.response.admin.AdminStatsResponse;
import com.thuetoi.dto.response.admin.UserAdminResponse;
import com.thuetoi.entity.KycRequest;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.Report;
import com.thuetoi.entity.SystemSetting;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WithdrawalRequest;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.KycRequestRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.ReportRepository;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WithdrawalRequestRepository;

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
    private NotificationService notificationService;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private KycRequestRepository kycRequestRepository;

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long totalFreelancers = userRepository.countByRole("freelancer");
        long totalCustomers = userRepository.countByRole("customer");
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.IN_PROGRESS.getValue());
        long completedContracts = contractRepository.countByStatus("completed");
        java.math.BigDecimal totalGmv = contractRepository.calculateTotalGmv();

        // Matching Rate: proportion of projects that have at least one contract
        long totalContracts = contractRepository.count();
        double matchingRate = totalProjects > 0 ? Math.min(100.0, (double) totalContracts / totalProjects * 100.0) : 0.0;

        // User Growth Trend: Last 7 days
        List<Object[]> rawTrend = userRepository.getUserGrowthTrend();
        java.util.Map<String, Long> trend = new java.util.LinkedHashMap<>();
        for (Object[] row : rawTrend) {
            trend.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        return AdminStatsResponse.builder()
            .totalUsers(totalUsers)
            .totalFreelancers(totalFreelancers)
            .totalCustomers(totalCustomers)
            .totalProjects(totalProjects)
            .activeProjects(activeProjects)
            .completedContracts(completedContracts)
            .totalGmv(totalGmv)
            .matchingRate(matchingRate)
            .userGrowthTrend(trend)
            .build();
    }

    @Transactional
    public void updateUserRole(Long userId, String newRole, Long adminId) {
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "User not found", HttpStatus.NOT_FOUND));

        if (adminId != null && adminId.equals(userId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không thể tự thay đổi vai trò của chính mình để bảo vệ quyền quản trị", HttpStatus.FORBIDDEN);
        }

        target.setRole(normalizeManagedRole(newRole));
        userRepository.save(target);

        notificationService.createNotificationForUser(userId, "system", "Quyền hạn tài khoản thay đổi",
            "Vai trò của bạn đã được quản trị viên cập nhật thành: " + newRole, "/workspace/profile");
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
                .balance(user.getBalance())
                .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void toggleUserStatus(Long userId, Long adminId, String reason) {
        if (adminId != null && adminId.equals(userId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không thể tự khóa hoặc mở khóa tài khoản của chính mình", HttpStatus.FORBIDDEN);
        }
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

    @Transactional
    public void bulkToggleUserStatus(List<Long> userIds, boolean active, String reason, Long adminId) {
        if (adminId != null && userIds.contains(adminId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không thể áp dụng thao tác hàng loạt lên chính tài khoản quản trị đang đăng nhập", HttpStatus.FORBIDDEN);
        }
        for (Long userId : userIds) {
            userRepository.findById(userId).ifPresent(user -> {
                user.setIsActive(active);
                userRepository.save(user);

                String statusText = active ? "kích hoạt" : "khóa";
                notificationService.createNotificationForUser(
                    user.getId(),
                    "system",
                    "Cập nhật trạng thái tài khoản hàng loạt",
                    "Tài khoản của bạn đã được " + statusText + " bởi quản trị viên. Lý do: " + (reason != null ? reason : "Vi phạm chính sách hệ thống."),
                    "/workspace/profile"
                );
            });
        }
    }

    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Project updateProjectStatus(Long projectId, String status) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("ERR_PROJECT_01", "Project not found", HttpStatus.NOT_FOUND));

        ProjectStatus normalizedStatus = normalizeAdminManagedProjectStatus(status);

        project.setStatus(normalizedStatus.getValue());
        Project saved = projectRepository.save(project);

        // Notify owner
        notificationService.createNotificationForUser(
            project.getUser().getId(), "system", "Project status updated by admin", "Status: " + normalizedStatus.getValue(), "/projects/" + projectId);

        return saved;
    }

    @Transactional
    public void bulkUpdateProjectStatus(List<Long> projectIds, String status) {
        ProjectStatus normalizedStatus = normalizeAdminManagedProjectStatus(status);

        for (Long projectId : projectIds) {
            projectRepository.findById(projectId).ifPresent(project -> {
                project.setStatus(normalizedStatus.getValue());
                projectRepository.save(project);

                notificationService.createNotificationForUser(
                    project.getUser().getId(),
                    "system",
                    "Cập nhật trạng thái dự án hàng loạt",
                    "Trạng thái dự án của bạn đã được cập nhật thành: " + normalizedStatus.getValue(),
                    "/projects/" + projectId
                );
            });
        }
    }

    // --- KYC Management ---

    @Transactional(readOnly = true)
    public List<KycRequest> getAllKycRequests() {
        return kycRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public KycRequest approveKyc(Long kycId) {
        KycRequest request = kycRequestRepository.findById(kycId)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy yêu cầu xác thực", HttpStatus.NOT_FOUND));
        ensurePendingKyc(request);

        request.setStatus("APPROVED");
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new BusinessException("ERR_USER_01", "User not found", HttpStatus.NOT_FOUND));
        user.setVerified(true);
        userRepository.save(user);

        notificationService.createNotificationForUser(user.getId(), "system", "Tài khoản đã được xác thực", "Hồ sơ của bạn đã được kiểm duyệt và cấp huy hiệu xác thực.", "/profile");
        return kycRequestRepository.save(request);
    }

    @Transactional
    public KycRequest rejectKyc(Long kycId, String reason) {
        KycRequest request = kycRequestRepository.findById(kycId)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy yêu cầu xác thực", HttpStatus.NOT_FOUND));
        ensurePendingKyc(request);

        request.setStatus("REJECTED");
        request.setNote(reason);

        notificationService.createNotificationForUser(request.getUserId(), "system", "Yêu cầu xác thực bị từ chối", "Lý do: " + reason, "/profile");
        return kycRequestRepository.save(request);
    }

    // --- Report Management ---

    @Transactional(readOnly = true)
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    @Transactional
    public Report updateReportStatus(Long reportId, String status) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy báo cáo", HttpStatus.NOT_FOUND));

        report.setStatus(normalizeReportStatus(status));
        return reportRepository.save(report);
    }

    // --- Finance & Withdrawal Management ---

    @Transactional(readOnly = true)
    public List<WithdrawalRequest> getAllWithdrawals() {
        return withdrawalRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public WithdrawalRequest processWithdrawal(Long withdrawalId, String status, String note, Long adminId) {
        WithdrawalRequest request = withdrawalRequestRepository.findByIdForUpdate(withdrawalId)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy yêu cầu rút tiền", HttpStatus.NOT_FOUND));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu đã được xử lý trước đó", HttpStatus.BAD_REQUEST);
        }

        String normalizedStatus = normalizeWithdrawalStatus(status);
        String normalizedNote = note == null ? null : note.trim();
        request.setStatus(normalizedStatus);
        request.setNote(normalizedNote);
        request.setProcessedBy(adminId);

        if ("APPROVED".equals(request.getStatus())) {
            User user = userRepository.findByIdForUpdate(request.getUserId())
                .orElseThrow(() -> new BusinessException("ERR_USER_01", "User not found", HttpStatus.NOT_FOUND));

            if (user.getBalance().compareTo(request.getAmount()) < 0) {
                throw new BusinessException("ERR_SYS_02", "Số dư người dùng không đủ để thực hiện lệnh này", HttpStatus.BAD_REQUEST);
            }

            user.setBalance(user.getBalance().subtract(request.getAmount()));
            userRepository.save(user);

            notificationService.createNotificationForUser(user.getId(), "system", "Lệnh rút tiền thành công",
                "Số tiền " + request.getAmount() + " đã được chuyển tới tài khoản của bạn.", "/workspace/finance");
        } else {
            String rejectionReason = normalizedNote;
            if (rejectionReason == null || rejectionReason.isBlank()) {
                rejectionReason = "Yêu cầu rút tiền bị từ chối bởi quản trị viên.";
            }
            request.setNote(rejectionReason);

            notificationService.createNotificationForUser(request.getUserId(), "system", "Lệnh rút tiền bị từ chối",
                "Lý do: " + rejectionReason, "/workspace/finance");
        }

        return withdrawalRequestRepository.save(request);
    }

    // --- System Settings ---

    @Transactional(readOnly = true)
    public List<SystemSetting> getSettings() {
        return systemSettingRepository.findAll();
    }

    @Transactional
    public SystemSetting updateSetting(String key, String value) {
        SystemSetting setting = systemSettingRepository.findById(key)
            .orElse(SystemSetting.builder().key(key).build());

        setting.setValue(value);
        return systemSettingRepository.save(setting);
    }

    private String normalizeManagedRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Vai trò người dùng không được để trống", HttpStatus.BAD_REQUEST);
        }
        String normalizedRole = role.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("customer", "freelancer", "admin").contains(normalizedRole)) {
            throw new BusinessException("ERR_SYS_02", "Vai trò người dùng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedRole;
    }

    private ProjectStatus normalizeAdminManagedProjectStatus(String status) {
        ProjectStatus normalizedStatus = ProjectStatus.fromValue(status)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Trạng thái project không hợp lệ", HttpStatus.BAD_REQUEST));
        if (normalizedStatus == ProjectStatus.IN_PROGRESS || normalizedStatus == ProjectStatus.COMPLETED) {
            throw new BusinessException(
                "ERR_SYS_02",
                "Admin chỉ được chuyển trạng thái dự án sang open hoặc cancelled để tránh phá vỡ luồng hợp đồng",
                HttpStatus.BAD_REQUEST
            );
        }
        return normalizedStatus;
    }

    private void ensurePendingKyc(KycRequest request) {
        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu KYC đã được xử lý trước đó", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeReportStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái báo cáo không được để trống", HttpStatus.BAD_REQUEST);
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("RESOLVED", "DISMISSED").contains(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái báo cáo không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }

    private String normalizeWithdrawalStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái yêu cầu rút tiền không được để trống", HttpStatus.BAD_REQUEST);
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "REJECTED").contains(normalizedStatus)) {
            throw new BusinessException("ERR_SYS_02", "Trạng thái yêu cầu rút tiền không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedStatus;
    }
}
