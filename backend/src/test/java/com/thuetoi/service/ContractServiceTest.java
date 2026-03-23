package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.MilestoneRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private MilestoneRepository milestoneRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ContractAccessService contractAccessService;

    @InjectMocks
    private ContractService contractService;

    @Test
    void createContractFromBidCreatesContractAndUpdatesProjectState() {
        User customer = user(1L, "customer");
        User selectedFreelancer = user(2L, "freelancer");
        User rejectedFreelancer = user(3L, "freelancer");

        Project project = project(10L, customer, "Landing page", "open");
        Bid selectedBid = bid(100L, project, selectedFreelancer, 250.0, "pending");
        Bid rejectedBid = bid(101L, project, rejectedFreelancer, 300.0, "pending");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(bidRepository.findById(100L)).thenReturn(Optional.of(selectedBid));
        when(contractRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(bidRepository.findByProjectId(10L)).thenReturn(List.of(selectedBid, rejectedBid));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId(999L);
            return contract;
        });

        Contract contract = contractService.createContractFromBid(1L, 100L);

        assertThat(contract.getId()).isEqualTo(999L);
        assertThat(contract.getProjectId()).isEqualTo(10L);
        assertThat(contract.getClientId()).isEqualTo(1L);
        assertThat(contract.getFreelancerId()).isEqualTo(2L);
        assertThat(contract.getTotalAmount()).isEqualTo(250.0);
        assertThat(contract.getStatus()).isEqualTo("in_progress");
        assertThat(contract.getProgress()).isZero();

        assertThat(selectedBid.getStatus()).isEqualTo("accepted");
        assertThat(rejectedBid.getStatus()).isEqualTo("rejected");
        assertThat(project.getStatus()).isEqualTo("in_progress");

        verify(bidRepository).saveAll(List.of(selectedBid, rejectedBid));
        verify(projectRepository).save(project);
        verify(contractRepository).save(any(Contract.class));
        verify(notificationService).createNotificationForUser(
            eq(2L),
            eq("contract"),
            eq("Bạn có hợp đồng mới"),
            eq("Khách hàng đã chấp nhận bid của bạn cho project \"Landing page\"."),
            eq("/workspace/contracts")
        );
    }

    @Test
    void createContractFromBidRejectsCustomerWhoDoesNotOwnProject() {
        User customer = user(1L, "customer");
        User projectOwner = user(9L, "customer");
        User freelancer = user(2L, "freelancer");

        Project project = project(10L, projectOwner, "API project", "open");
        Bid selectedBid = bid(100L, project, freelancer, 180.0, "pending");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(bidRepository.findById(100L)).thenReturn(Optional.of(selectedBid));

        assertThatThrownBy(() -> contractService.createContractFromBid(1L, 100L))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_AUTH_04");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            });

        verify(contractRepository, never()).save(any(Contract.class));
        verify(projectRepository, never()).save(any(Project.class));
        verify(notificationService, never()).createNotificationForUser(any(), any(), any(), any(), any());
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

    private Project project(Long id, User owner, String title, String status) {
        Project project = new Project();
        project.setId(id);
        project.setUser(owner);
        project.setTitle(title);
        project.setStatus(status);
        return project;
    }

    private Bid bid(Long id, Project project, User freelancer, Double price, String status) {
        Bid bid = new Bid();
        bid.setId(id);
        bid.setProject(project);
        bid.setFreelancer(freelancer);
        bid.setPrice(price);
        bid.setStatus(status);
        return bid;
    }
}
