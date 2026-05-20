package com.thuetoi.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillService skillService;

    @Mock
    private AttachmentMetadataService attachmentMetadataService;

    @InjectMocks
    private ProjectService projectService;

    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setRole("customer");

        testProject = new Project();
        testProject.setId(1L);
        testProject.setUser(testUser);
        testProject.setTitle("Test Project");
        testProject.setDescription("Test Description");
        testProject.setBudgetMin(BigDecimal.valueOf(100));
        testProject.setBudgetMax(BigDecimal.valueOf(500));
        testProject.setStatus(ProjectStatus.OPEN.getValue());
    }

    @Test
    void testGetAllProjects() {
        List<Project> projects = new ArrayList<>();
        projects.add(testProject);

        when(projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN.getValue()))
            .thenReturn(projects);

        List<Project> result = projectService.getAllProjects();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Project", result.get(0).getTitle());
        verify(projectRepository, times(1)).findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN.getValue());
    }

    @Test
    void testGetProjectsByStatus() {
        List<Project> projects = new ArrayList<>();
        projects.add(testProject);

        when(projectRepository.findByStatus(ProjectStatus.OPEN.getValue()))
            .thenReturn(projects);

        List<Project> result = projectService.getProjectsByStatus(ProjectStatus.OPEN.getValue());

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(projectRepository, times(1)).findByStatus(ProjectStatus.OPEN.getValue());
    }

    @Test
    void testGetProjectsByUser() {
        List<Project> projects = new ArrayList<>();
        projects.add(testProject);

        when(projectRepository.findByUserIdOrderByCreatedAtDesc(1L))
            .thenReturn(projects);

        List<Project> result = projectService.getProjectsByUser(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(projectRepository, times(1)).findByUserIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void testGetProject() {
        when(projectRepository.findById(1L))
            .thenReturn(Optional.of(testProject));

        Optional<Project> result = projectService.getProject(1L);

        assertTrue(result.isPresent());
        assertEquals("Test Project", result.get().getTitle());
        verify(projectRepository, times(1)).findById(1L);
    }

    @Test
    void testCreateProjectSuccess() {
        when(userRepository.findById(1L))
            .thenReturn(Optional.of(testUser));
        when(projectRepository.save(any(Project.class)))
            .thenReturn(testProject);
        when(projectRepository.findById(1L))
            .thenReturn(Optional.of(testProject));

        Project result = projectService.createProject(
            1L,
            "Test Project",
            "Test Description",
            BigDecimal.valueOf(100),
            BigDecimal.valueOf(500),
            LocalDateTime.now()
        );

        assertNotNull(result);
        assertEquals("Test Project", result.getTitle());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void testCreateProjectWithInvalidUser() {
        when(userRepository.findById(999L))
            .thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> {
            projectService.createProject(
                999L,
                "Test Project",
                "Test Description",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(500),
                LocalDateTime.now()
            );
        });
    }

    @Test
    void testDeleteProject() {
        when(projectRepository.findById(1L))
            .thenReturn(Optional.of(testProject));

        projectService.deleteProject(1L, 1L);

        verify(projectRepository, times(1)).delete(testProject);
    }
}
