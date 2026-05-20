package com.thuetoi.service;

import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.repository.KycRequestRepository;
import com.thuetoi.repository.WithdrawalRequestRepository;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.ReportRepository;
import com.thuetoi.repository.SystemSettingRepository;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private KycRequestRepository kycRequestRepository;

    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void testWorkflowAdminCancelProject() {
        // Mock các đối tượng
        Project mockProject = Mockito.mock(Project.class);
        User mockOwner = Mockito.mock(User.class);

        // Quy định hành vi cho mock (Stubbing)
        when(projectRepository.findById(anyLong())).thenReturn(Optional.of(mockProject));
        when(mockProject.getUser()).thenReturn(mockOwner);

        // Vì getId() giờ là method Java thuần trong BaseEntity, trình biên dịch sẽ cho phép gọi
        when(mockOwner.getId()).thenReturn(100L);

        // Admin thực hiện hủy dự án
        adminService.updateProjectStatus(1L, "cancelled");

        // Kiểm tra xem trạng thái có được set và lưu lại không
        verify(mockProject).setStatus("cancelled");
        verify(projectRepository).save(mockProject);

        // Kiểm tra xem thông báo có được gửi cho chủ sở hữu dự án (User ID 100) không
        verify(notificationService).createNotificationForUser(
            eq(100L),
            eq("project"),
            eq("Trạng thái dự án đã được cập nhật"),
            anyString(),
            eq("/workspace/projects")
        );
    }

    @Test
    void testWorkflowAdminRejectIllegalStatus() {
        Project mockProject = Mockito.mock(Project.class);
        when(projectRepository.findById(anyLong())).thenReturn(Optional.of(mockProject));

        // Chặn Admin chuyển sang in_progress (trạng thái thuộc về Contract Flow)
        assertThatThrownBy(() -> adminService.updateProjectStatus(1L, "in_progress"))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void testWorkflowAdminProjectNotFound() {
        when(projectRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Ném lỗi khi ID không tồn tại
        assertThatThrownBy(() -> adminService.updateProjectStatus(999L, "cancelled"))
            .isInstanceOf(BusinessException.class);
    }
}
