package com.thuetoi.service;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;

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
            eq("/workspace/finance")
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
