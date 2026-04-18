package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BidServiceTest {

    @Mock
    private BidRepository bidRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ContractService contractService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BidService bidService;

    @Test
    void createBidCreatesPendingBidAndNotifiesProjectOwner() {
        User customer = user(1L, "customer");
        User freelancer = user(2L, "freelancer");
        Project project = project(10L, customer, "open");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(2L)).thenReturn(Optional.of(freelancer));
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Bid created = bidService.createBid(10L, 2L, BigDecimal.valueOf(2000000), "  Em co the lam trong 5 ngay  ", "5 ngày", null);

        assertThat(created.getStatus()).isEqualTo("pending");
        assertThat(created.getPrice()).isEqualTo(BigDecimal.valueOf(2000000));
        assertThat(created.getMessage()).isEqualTo("Em co the lam trong 5 ngay");

        verify(notificationService).createNotificationForUser(
            1L,
            "bid",
            "Bạn có bid mới",
            "Freelancer \"User 2\" vừa gửi bid cho project \"Project 10\".",
            "/workspace/projects"
        );
    }

    @Test
    void updateBidStatusAllowsFreelancerToWithdrawPendingBid() {
        User customer = user(1L, "customer");
        User freelancer = user(2L, "freelancer");
        Project project = project(10L, customer, "open");
        Bid bid = bid(100L, project, freelancer, "pending");

        when(bidRepository.findById(100L)).thenReturn(Optional.of(bid));
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Bid updated = bidService.updateBidStatus(100L, 2L, "withdrawn");

        assertThat(updated.getStatus()).isEqualTo("withdrawn");
    }

    @Test
    void updateBidStatusAllowsCustomerToRejectPendingBid() {
        User customer = user(1L, "customer");
        User freelancer = user(2L, "freelancer");
        Project project = project(10L, customer, "open");
        Bid bid = bid(100L, project, freelancer, "pending");

        when(bidRepository.findById(100L)).thenReturn(Optional.of(bid));
        when(bidRepository.save(any(Bid.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Bid updated = bidService.updateBidStatus(100L, 1L, "rejected");

        assertThat(updated.getStatus()).isEqualTo("rejected");
        verify(notificationService).createNotificationForUser(
            2L,
            "bid",
            "Bid của bạn đã bị từ chối",
            "Khách hàng đã từ chối bid của bạn cho project \"Project 10\".",
            "/workspace/projects"
        );
    }

    @Test
    void updateBidStatusRejectsInvalidManualAcceptedStatus() {
        User customer = user(1L, "customer");
        User freelancer = user(2L, "freelancer");
        Project project = project(10L, customer, "open");
        Bid bid = bid(100L, project, freelancer, "pending");

        when(bidRepository.findById(100L)).thenReturn(Optional.of(bid));

        assertThatThrownBy(() -> bidService.updateBidStatus(100L, 1L, "accepted"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(bidRepository, never()).save(any(Bid.class));
    }

    private User user(Long id, String role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setEmail("user" + id + "@thuetoi.test");
        user.setFullName("User " + id);
        user.setPasswordHash("hashed");
        return user;
    }

    private Project project(Long id, User owner, String status) {
        Project project = new Project();
        project.setId(id);
        project.setUser(owner);
        project.setTitle("Project " + id);
        project.setStatus(status);
        return project;
    }

    private Bid bid(Long id, Project project, User freelancer, String status) {
        Bid bid = new Bid();
        bid.setId(id);
        bid.setProject(project);
        bid.setFreelancer(freelancer);
        bid.setPrice(BigDecimal.valueOf(1500000));
        bid.setStatus(status);
        return bid;
    }
}
