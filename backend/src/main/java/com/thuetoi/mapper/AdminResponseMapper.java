package com.thuetoi.mapper;

import com.thuetoi.dto.response.admin.AdminAuditLogResponse;
import com.thuetoi.dto.response.admin.AdminKycResponse;
import com.thuetoi.dto.response.admin.AdminProjectResponse;
import com.thuetoi.dto.response.admin.AdminReportResponse;
import com.thuetoi.dto.response.admin.AdminUserSummaryResponse;
import com.thuetoi.dto.response.admin.AdminWithdrawalResponse;
import com.thuetoi.dto.response.admin.SystemSettingAdminResponse;
import com.thuetoi.entity.AuditLog;
import com.thuetoi.entity.KycRequest;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.Report;
import com.thuetoi.entity.Skill;
import com.thuetoi.entity.SystemSetting;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WithdrawalRequest;
import com.thuetoi.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class AdminResponseMapper {

    private final UserRepository userRepository;

    public AdminResponseMapper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AdminProjectResponse toProjectResponse(Project project) {
        if (project == null) {
            return null;
        }
        return new AdminProjectResponse(
            project.getId(),
            toUserSummary(project.getUser()),
            project.getTitle(),
            project.getDescription(),
            project.getBudgetMin(),
            project.getBudgetMax(),
            project.getDeadline(),
            project.getStatus(),
            toSkillNames(project.getSkills()),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }

    public List<AdminProjectResponse> toProjectResponses(List<Project> projects) {
        return projects.stream().map(this::toProjectResponse).toList();
    }

    public List<AdminKycResponse> toKycResponses(List<KycRequest> requests) {
        Map<Long, User> usersById = loadUsersByIds(requests.stream().map(KycRequest::getUserId).toList());
        return requests.stream().map(request -> toKycResponse(request, usersById)).toList();
    }

    public AdminKycResponse toKycResponse(KycRequest request) {
        if (request == null) {
            return null;
        }
        return toKycResponse(request, loadUsersByIds(List.of(request.getUserId())));
    }

    public List<AdminReportResponse> toReportResponses(List<Report> reports) {
        Map<Long, User> usersById = loadUsersByIds(reports.stream().map(Report::getReporterId).toList());
        return reports.stream().map(report -> toReportResponse(report, usersById)).toList();
    }

    public AdminReportResponse toReportResponse(Report report) {
        if (report == null) {
            return null;
        }
        return toReportResponse(report, loadUsersByIds(List.of(report.getReporterId())));
    }

    public List<AdminWithdrawalResponse> toWithdrawalResponses(List<WithdrawalRequest> requests) {
        Map<Long, User> usersById = loadUsersByIds(requests.stream().map(WithdrawalRequest::getUserId).toList());
        return requests.stream().map(request -> toWithdrawalResponse(request, usersById)).toList();
    }

    public AdminWithdrawalResponse toWithdrawalResponse(WithdrawalRequest request) {
        if (request == null) {
            return null;
        }
        return toWithdrawalResponse(request, loadUsersByIds(List.of(request.getUserId())));
    }

    public List<AdminAuditLogResponse> toAuditLogResponses(List<AuditLog> logs) {
        return logs.stream().map(this::toAuditLogResponse).toList();
    }

    public AdminAuditLogResponse toAuditLogResponse(AuditLog log) {
        if (log == null) {
            return null;
        }
        return new AdminAuditLogResponse(
            log.getId(),
            log.getAdminEmail(),
            log.getAction(),
            log.getEntityType(),
            log.getEntityId(),
            log.getDetail(),
            log.getIpAddress(),
            log.getCreatedAt()
        );
    }

    public List<SystemSettingAdminResponse> toSystemSettingResponses(List<SystemSetting> settings) {
        return settings.stream().map(this::toSystemSettingResponse).toList();
    }

    public SystemSettingAdminResponse toSystemSettingResponse(SystemSetting setting) {
        if (setting == null) {
            return null;
        }
        return new SystemSettingAdminResponse(
            setting.getKey(),
            setting.getValue(),
            setting.getDescription(),
            setting.getUpdatedAt()
        );
    }

    private AdminKycResponse toKycResponse(KycRequest request, Map<Long, User> usersById) {
        if (request == null) {
            return null;
        }
        return new AdminKycResponse(
            request.getId(),
            toUserSummary(usersById.get(request.getUserId())),
            request.getStatus(),
            request.getNote(),
            request.getCreatedAt(),
            request.getUpdatedAt()
        );
    }

    private AdminReportResponse toReportResponse(Report report, Map<Long, User> usersById) {
        if (report == null) {
            return null;
        }
        return new AdminReportResponse(
            report.getId(),
            toUserSummary(usersById.get(report.getReporterId())),
            report.getTargetType(),
            report.getTargetId(),
            report.getReason(),
            report.getDescription(),
            report.getStatus(),
            report.getCreatedAt(),
            report.getUpdatedAt()
        );
    }

    private AdminWithdrawalResponse toWithdrawalResponse(WithdrawalRequest request, Map<Long, User> usersById) {
        if (request == null) {
            return null;
        }
        return new AdminWithdrawalResponse(
            request.getId(),
            toUserSummary(usersById.get(request.getUserId())),
            request.getAmount(),
            request.getBankInfo(),
            request.getStatus(),
            request.getNote(),
            request.getProcessedBy(),
            request.getCreatedAt(),
            request.getUpdatedAt()
        );
    }

    private AdminUserSummaryResponse toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return new AdminUserSummaryResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getAvatarUrl()
        );
    }

    private List<String> toSkillNames(Collection<Skill> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of();
        }
        return skills.stream()
            .map(Skill::getName)
            .filter(Objects::nonNull)
            .filter(name -> !name.isBlank())
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .toList();
    }

    private Map<Long, User> loadUsersByIds(Collection<Long> userIds) {
        LinkedHashMap<Long, User> usersById = new LinkedHashMap<>();
        userRepository.findAllById(
            userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList()
        ).forEach(user -> usersById.put(user.getId(), user));
        return usersById;
    }
}
