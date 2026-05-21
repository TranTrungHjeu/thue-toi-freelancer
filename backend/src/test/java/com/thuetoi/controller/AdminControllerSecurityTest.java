package com.thuetoi.controller;

import com.thuetoi.config.WebConfig;
import com.thuetoi.dto.response.admin.AdminStatsResponse;
import com.thuetoi.dto.response.admin.AdminUserPageResponse;
import com.thuetoi.dto.response.admin.AdminUserSummaryStatsResponse;
import com.thuetoi.dto.response.admin.UserAdminResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.AdminResponseMapper;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.security.JwtAuthenticationFilter;
import com.thuetoi.security.RestAccessDeniedHandler;
import com.thuetoi.security.RestAuthenticationEntryPoint;
import com.thuetoi.security.SecurityConfig;
import com.thuetoi.service.AdminService;
import com.thuetoi.service.AuditLogService;
import com.thuetoi.service.MessageService;
import com.thuetoi.service.NotificationDeliveryLogService;
import com.thuetoi.service.NotificationService;
import com.thuetoi.service.SkillService;
import com.thuetoi.service.SystemHealthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = AdminController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebConfig.class)
)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
@SuppressWarnings("unused")
class AdminControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @MockBean
    private SkillService skillService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private NotificationDeliveryLogService notificationDeliveryLogService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private SystemHealthService systemHealthService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @MockBean
    private AdminResponseMapper adminResponseMapper;

    @MockBean
    private MarketplaceResponseMapper marketplaceResponseMapper;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean(name = "jpaMappingContext")
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(invocation -> {
            FilterChain filterChain = invocation.getArgument(2);
            filterChain.doFilter(
                invocation.getArgument(0, ServletRequest.class),
                invocation.getArgument(1, ServletResponse.class)
            );
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
    }

    @Test
    void adminEndpointRejectsAnonymousRequest() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("ERR_AUTH_01"));
    }

    @Test
    void adminEndpointRejectsNonAdminRole() throws Exception {
        mockMvc.perform(
                get("/api/v1/admin/stats")
                    .with(SecurityMockMvcRequestPostProcessors.user("12").roles("CUSTOMER"))
            )
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("ERR_AUTH_04"));
    }

    @Test
    void adminEndpointAllowsAdminRole() throws Exception {
        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalUsers(10);
        stats.setTotalFreelancers(4);
        stats.setTotalCustomers(5);
        stats.setTotalProjects(6);
        stats.setActiveProjects(3);
        stats.setCompletedContracts(2);
        stats.setTotalGmv(BigDecimal.valueOf(1500000));
        stats.setMatchingRate(33.3);
        stats.setUserGrowthTrend(Map.of("2026-04-22", 2L));

        when(adminService.getSystemStats()).thenReturn(stats);

        mockMvc.perform(
                get("/api/v1/admin/stats")
                    .with(SecurityMockMvcRequestPostProcessors.user("1").roles("ADMIN"))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalUsers").value(10));
    }

    @Test
    void adminUserPageEndpointReturnsPagedContract() throws Exception {
        UserAdminResponse user = new UserAdminResponse();
        user.setId(12L);
        user.setEmail("anna@example.com");
        user.setFullName("Anna Freelancer");
        user.setRole("freelancer");
        user.setIsActive(true);
        user.setVerified(true);

        AdminUserSummaryStatsResponse summary = new AdminUserSummaryStatsResponse();
        summary.setTotalUsers(9);
        summary.setActiveUsers(7);
        summary.setLockedUsers(2);
        summary.setVerifiedUsers(5);
        summary.setFreelancerUsers(4);
        summary.setCustomerUsers(3);
        summary.setAdminUsers(2);

        AdminUserPageResponse pageResp = new AdminUserPageResponse();
        pageResp.setContent(List.of(user));
        pageResp.setPage(0);
        pageResp.setSize(20);
        pageResp.setTotalElements(1);
        pageResp.setTotalPages(1);
        pageResp.setSummary(summary);

        when(adminService.getUserPage(0, 20, "anna", "freelancer", "active", true, "fullName", "asc"))
            .thenReturn(pageResp);

        mockMvc.perform(
                get("/api/v1/admin/users/page")
                    .param("page", "0")
                    .param("size", "20")
                    .param("q", "anna")
                    .param("role", "freelancer")
                    .param("status", "active")
                    .param("verified", "true")
                    .param("sort", "fullName")
                    .param("direction", "asc")
                    .with(SecurityMockMvcRequestPostProcessors.user("1").roles("ADMIN"))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content[0].fullName").value("Anna Freelancer"))
            .andExpect(jsonPath("$.data.summary.activeUsers").value(7));
    }

    @Test
    void adminUserDetailEndpointReturnsNotFoundForMissingUser() throws Exception {
        when(adminService.getUserDetail(999L))
            .thenThrow(new BusinessException("ERR_USER_01", "User not found", HttpStatus.NOT_FOUND));

        mockMvc.perform(
                get("/api/v1/admin/users/999")
                    .with(SecurityMockMvcRequestPostProcessors.user("1").roles("ADMIN"))
            )
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("ERR_USER_01"));
    }
}
