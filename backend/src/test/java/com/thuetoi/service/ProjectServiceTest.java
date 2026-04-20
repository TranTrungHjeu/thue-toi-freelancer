package com.thuetoi.service;

import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createProjectSetsOpenStatusForCustomer() {
        User customer = user(5L, "customer");
        LocalDateTime deadline = LocalDateTime.now().plusDays(7);
        Project persistedProject = new Project();
        persistedProject.setId(12L);
        persistedProject.setUser(customer);
        persistedProject.setTitle("Xay dung landing page");
        persistedProject.setDescription("Can freelancer fullstack");
        persistedProject.setBudgetMin(BigDecimal.valueOf(1000000));
        persistedProject.setBudgetMax(BigDecimal.valueOf(2000000));
        persistedProject.setDeadline(deadline);
        persistedProject.setStatus("open");

        when(userRepository.findById(5L)).thenReturn(Optional.of(customer));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project savedProject = invocation.getArgument(0);
            savedProject.setId(12L);
            return savedProject;
        });
        when(projectRepository.findById(12L)).thenReturn(Optional.of(persistedProject));

        Project project = projectService.createProject(
            5L,
            "  Xay dung landing page  ",
            "  Can freelancer fullstack  ",
            BigDecimal.valueOf(1000000),
            BigDecimal.valueOf(2000000),
            deadline
        );

        assertThat(project.getUser()).isEqualTo(customer);
        assertThat(project.getTitle()).isEqualTo("Xay dung landing page");
        assertThat(project.getDescription()).isEqualTo("Can freelancer fullstack");
        assertThat(project.getBudgetMin()).isEqualTo(BigDecimal.valueOf(1000000));
        assertThat(project.getBudgetMax()).isEqualTo(BigDecimal.valueOf(2000000));
        assertThat(project.getDeadline()).isEqualTo(deadline);
        assertThat(project.getStatus()).isEqualTo("open");
    }

    @Test
    void getProjectsByStatusRejectsInvalidStatus() {
        assertThatThrownBy(() -> projectService.getProjectsByStatus("draft"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(projectRepository, never()).findByStatus(any());
    }

    @Test
    void updateProjectRejectsManualInProgressStatus() {
        User customer = user(5L, "customer");
        Project project = new Project();
        project.setId(12L);
        project.setUser(customer);
        project.setTitle("Current title");
        project.setStatus("open");

        when(projectRepository.findById(12L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.updateProject(
            12L,
            5L,
            "New title",
            "New description",
            BigDecimal.valueOf(1000000),
            BigDecimal.valueOf(2000000),
            LocalDateTime.now().plusDays(7),
            "in_progress"
        ))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

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
}
