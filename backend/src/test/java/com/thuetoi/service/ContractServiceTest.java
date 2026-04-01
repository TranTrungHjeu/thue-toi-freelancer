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

import java.time.LocalDateTime;
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
        verify(notificationService).createNotificationForUser(
            eq(3L),
            eq("bid"),
            eq("Bid của bạn không được chọn"),
            eq("Khách hàng đã chọn một bid khác cho project \"Landing page\"."),
            eq("/workspace/projects")
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

    @Test
    void createContractFromBidKeepsWithdrawnBidUnchanged() {
        User customer = user(1L, "customer");
        User selectedFreelancer = user(2L, "freelancer");
        User withdrawnFreelancer = user(3L, "freelancer");

        Project project = project(10L, customer, "Mobile app", "open");
        Bid selectedBid = bid(100L, project, selectedFreelancer, 400.0, "pending");
        Bid withdrawnBid = bid(101L, project, withdrawnFreelancer, 520.0, "withdrawn");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(bidRepository.findById(100L)).thenReturn(Optional.of(selectedBid));
        when(contractRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(bidRepository.findByProjectId(10L)).thenReturn(List.of(selectedBid, withdrawnBid));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Contract contract = contractService.createContractFromBid(1L, 100L);

        assertThat(contract.getStatus()).isEqualTo("in_progress");
        assertThat(selectedBid.getStatus()).isEqualTo("accepted");
        assertThat(withdrawnBid.getStatus()).isEqualTo("withdrawn");

        verify(bidRepository).saveAll(List.of(selectedBid, withdrawnBid));
        verify(projectRepository).save(project);
        verify(notificationService, never()).createNotificationForUser(
            eq(3L),
            any(),
            any(),
            any(),
            any()
        );
    }

    @Test
    void addMilestoneCreatesPendingMilestoneForCustomerContract() {
        Contract contract = contract(70L, 10L, 1L, 2L, "in_progress");
        LocalDateTime dueDate = LocalDateTime.of(2026, 4, 10, 0, 0);

        when(contractAccessService.requireCustomerContract(70L, 1L)).thenReturn(contract);
        when(milestoneRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var milestone = contractService.addMilestone(70L, 1L, "  Phase 1  ", 1_500_000.0, dueDate, null);

        assertThat(milestone.getContractId()).isEqualTo(70L);
        assertThat(milestone.getTitle()).isEqualTo("Phase 1");
        assertThat(milestone.getAmount()).isEqualTo(1_500_000.0);
        assertThat(milestone.getDueDate()).isEqualTo(dueDate);
        assertThat(milestone.getStatus()).isEqualTo("pending");
        verify(notificationService).createNotificationForUser(
            eq(2L),
            eq("contract"),
            eq("Bạn có milestone mới"),
            eq("Khách hàng vừa thêm milestone \"Phase 1\" cho contract #70."),
            eq("/workspace/contracts")
        );
    }

    @Test
    void addMilestoneRejectsFinishedContract() {
        Contract contract = contract(70L, 10L, 1L, 2L, "completed");

        when(contractAccessService.requireCustomerContract(70L, 1L)).thenReturn(contract);

        assertThatThrownBy(() -> contractService.addMilestone(70L, 1L, "Phase 2", 900_000.0, LocalDateTime.now(), null))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(milestoneRepository, never()).save(any());
    }

    @Test
    void addMilestoneRejectsNonCustomerAccess() {
        BusinessException forbidden = new BusinessException(
            "ERR_AUTH_04",
            "Bạn không có quyền tạo milestone cho hợp đồng này",
            HttpStatus.FORBIDDEN
        );

        when(contractAccessService.requireCustomerContract(70L, 2L)).thenThrow(forbidden);

        assertThatThrownBy(() -> contractService.addMilestone(70L, 2L, "Phase 2", 900_000.0, LocalDateTime.now(), null))
            .isSameAs(forbidden);

        verify(milestoneRepository, never()).save(any());
    }

    @Test
    void updateContractStatusCompletesContractAndSyncsProjectStatus() {
        Contract contract = contract(70L, 10L, 1L, 2L, "in_progress");
        Project project = project(10L, user(1L, "customer"), "Delivery", "in_progress");

        when(contractAccessService.requireAccessibleContract(70L, 2L)).thenReturn(contract);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Contract updated = contractService.updateContractStatus(70L, 2L, "completed");

        assertThat(updated.getStatus()).isEqualTo("completed");
        assertThat(updated.getEndDate()).isNotNull();
        assertThat(project.getStatus()).isEqualTo("completed");

        verify(projectRepository).save(project);
        verify(contractRepository).save(contract);
        verify(notificationService).createNotificationForUser(
            eq(1L),
            eq("contract"),
            eq("Hợp đồng đã hoàn thành"),
            eq("Contract #70 vừa được cập nhật sang trạng thái \"completed\"."),
            eq("/workspace/contracts")
        );
    }

    @Test
    void updateContractStatusRejectsChangesForFinishedContract() {
        Contract contract = contract(70L, 10L, 1L, 2L, "completed");

        when(contractAccessService.requireAccessibleContract(70L, 2L)).thenReturn(contract);

        assertThatThrownBy(() -> contractService.updateContractStatus(70L, 2L, "cancelled"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(contractRepository, never()).save(any(Contract.class));
        verify(projectRepository, never()).save(any(Project.class));
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

    private Contract contract(Long id, Long projectId, Long clientId, Long freelancerId, String status) {
        Contract contract = new Contract();
        contract.setId(id);
        contract.setProjectId(projectId);
        contract.setClientId(clientId);
        contract.setFreelancerId(freelancerId);
        contract.setStatus(status);
        contract.setProgress(0);
        contract.setStartDate(LocalDateTime.of(2026, 3, 24, 12, 0));
        return contract;
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
