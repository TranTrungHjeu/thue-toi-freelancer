package com.thuetoi.service;

import com.thuetoi.dto.response.admin.AdminUserPageResponse;
import com.thuetoi.entity.KycRequest;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.entity.WithdrawalRequest;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.KycRequestRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.ReportRepository;
import com.thuetoi.repository.SystemSettingRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.WithdrawalRequestRepository;
import com.thuetoi.service.NotificationService;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unused")
class AdminServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private KycRequestRepository kycRequestRepository;

    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void updateUserRoleRejectsSelfRoleChange() {
        User target = user(7L, "admin", BigDecimal.ZERO);

        when(userRepository.findById(7L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminService.updateUserRole(7L, "customer", 7L))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_04");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void toggleUserStatusRejectsSelfOperation() {
        assertThatThrownBy(() -> adminService.toggleUserStatus(9L, 9L, "Self lock attempt"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_04");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });

        verify(userRepository, never()).findById(any());
    }

    @Test
    void updateProjectStatusRejectsContractManagedStatuses() {
        Project project = new Project();
        project.setId(15L);
        project.setStatus("open");

        when(projectRepository.findById(15L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> adminService.updateProjectStatus(15L, "in_progress"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void getUserPageAppliesFiltersSortAndBuildsSummary() {
        User freelancer = user(12L, "freelancer", BigDecimal.valueOf(200000));
        freelancer.setFullName("Anna Freelancer");

        when(userRepository.searchAdminUsers(eq("anna"), eq("freelancer"), eq(true), eq(true), any(Pageable.class)))
            .thenReturn(new PageImpl<>(java.util.List.of(freelancer)));
        when(userRepository.count()).thenReturn(9L);
        when(userRepository.countByIsActiveTrue()).thenReturn(7L);
        when(userRepository.countByIsActiveFalse()).thenReturn(2L);
        when(userRepository.countByVerifiedTrue()).thenReturn(5L);
        when(userRepository.countByRole("customer")).thenReturn(3L);
        when(userRepository.countByRole("freelancer")).thenReturn(4L);
        when(userRepository.countByRole("admin")).thenReturn(2L);

        AdminUserPageResponse result = adminService.getUserPage(
            0,
            20,
            " Anna ",
            "freelancer",
            "active",
            true,
            "fullName",
            "asc"
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Anna Freelancer");
        assertThat(result.getSummary().getTotalUsers()).isEqualTo(9L);
        assertThat(result.getSummary().getActiveUsers()).isEqualTo(7L);
        assertThat(result.getSummary().getFreelancerUsers()).isEqualTo(4L);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userRepository).searchAdminUsers(eq("anna"), eq("freelancer"), eq(true), eq(true), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(20);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("fullName").isAscending()).isTrue();
    }

    @Test
    void getUserDetailReturnsProfileAndActivityStats() {
        User freelancer = user(15L, "freelancer", BigDecimal.valueOf(350000));
        freelancer.setProfileDescription("Senior Java developer");

        when(userRepository.findById(15L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.countByUserId(15L)).thenReturn(2L);
        when(bidRepository.countByFreelancerId(15L)).thenReturn(8L);
        when(contractRepository.countByClientIdOrFreelancerId(15L, 15L)).thenReturn(3L);

        var result = adminService.getUserDetail(15L);

        assertThat(result.getProfileDescription()).isEqualTo("Senior Java developer");
        assertThat(result.getProjectCount()).isEqualTo(2L);
        assertThat(result.getBidCount()).isEqualTo(8L);
        assertThat(result.getContractCount()).isEqualTo(3L);
    }

    @Test
    void approveKycRejectsAlreadyProcessedRequest() {
        KycRequest request = new KycRequest();
        request.setId(3L);
        request.setUserId(11L);
        request.setStatus("APPROVED");

        when(kycRequestRepository.findById(3L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> adminService.approveKyc(3L))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(userRepository, never()).findById(any());
        verify(kycRequestRepository, never()).save(any(KycRequest.class));
    }

    @Test
    void processWithdrawalApprovesAndDeductsUserBalance() {
        WithdrawalRequest request = new WithdrawalRequest();
        request.setId(8L);
        request.setUserId(25L);
        request.setAmount(BigDecimal.valueOf(150000));
        request.setStatus("PENDING");

        User user = user(25L, "freelancer", BigDecimal.valueOf(500000));

        when(withdrawalRequestRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(request));
        when(userRepository.findByIdForUpdate(25L)).thenReturn(Optional.of(user));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequest processed = adminService.processWithdrawal(8L, "approved", "Bank transfer completed", 1L);

        assertThat(processed.getStatus()).isEqualTo("APPROVED");
        assertThat(processed.getProcessedBy()).isEqualTo(1L);
        assertThat(user.getBalance()).isEqualByComparingTo(BigDecimal.valueOf(350000));

        verify(notificationService).createNotificationForUser(
            eq(25L),
            eq("system"),
            eq("Lệnh rút tiền thành công"),
            eq("Số tiền 150000 đã được chuyển tới tài khoản của bạn."),
            eq("/workspace/notifications")
        );
    }

    private User user(Long id, String role, BigDecimal balance) {
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@thuetoi.test");
        user.setFullName("User " + id);
        user.setRole(role);
        user.setIsActive(true);
        user.setVerified(true);
        user.setBalance(balance);
        return user;
    }
}
