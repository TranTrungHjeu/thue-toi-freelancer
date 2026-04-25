package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileAccessServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ContractAccessService contractAccessService;

    @Test
    void requireUploadAccessAllowsCustomerProjectCreateContext() {
        FileAccessService service = new FileAccessService(userRepository, projectRepository, contractAccessService);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "customer")));

        String context = service.requireUploadAccess("projects", 1L, null, null);

        assertThat(context).isEqualTo("projects");
    }

    @Test
    void requireUploadAccessRejectsBidUploadForOwnProject() {
        FileAccessService service = new FileAccessService(userRepository, projectRepository, contractAccessService);
        User freelancer = user(2L, "freelancer");
        Project project = project(10L, freelancer, "open");
        when(userRepository.findById(2L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> service.requireUploadAccess("bids", 2L, 10L, null))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_AUTH_04"));
    }

    @Test
    void requireUploadAccessRejectsMessageUploadForFinishedContract() {
        FileAccessService service = new FileAccessService(userRepository, projectRepository, contractAccessService);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L, "freelancer")));
        Contract contract = new Contract();
        contract.setId(5L);
        contract.setClientId(1L);
        contract.setFreelancerId(2L);
        contract.setStatus("completed");
        when(contractAccessService.requireAccessibleContract(5L, 2L)).thenReturn(contract);

        assertThatThrownBy(() -> service.requireUploadAccess("messages", 2L, null, 5L))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_SYS_02"));
    }

    private User user(Long id, String role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setEmail("user" + id + "@thuetoi.test");
        user.setFullName("User " + id);
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
}
