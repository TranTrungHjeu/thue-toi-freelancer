package com.thuetoi.controller;

import com.thuetoi.config.SecurityConfig;
import com.thuetoi.config.WebConfig;
import com.thuetoi.mapper.AdminResponseMapper;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.security.JwtAuthenticationFilter;
import com.thuetoi.security.RestAccessDeniedHandler;
import com.thuetoi.security.RestAuthenticationEntryPoint;
import com.thuetoi.service.AdminService;
import com.thuetoi.service.AuditLogService;
import com.thuetoi.service.NotificationService;
import com.thuetoi.service.SkillService;
import com.thuetoi.service.SystemHealthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.math.BigDecimal;
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
    private NotificationService notificationService;

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
        when(adminService.getSystemStats()).thenReturn(
            AdminStatsResponse.builder()
                .totalUsers(10)
                .totalFreelancers(4)
                .totalCustomers(5)
                .totalProjects(6)
                .activeProjects(3)
                .completedContracts(2)
                .totalGmv(BigDecimal.valueOf(1500000))
                .matchingRate(33.3)
                .userGrowthTrend(Map.of("2026-04-22", 2L))
                .build()
        );

        mockMvc.perform(
                get("/api/v1/admin/stats")
                    .with(SecurityMockMvcRequestPostProcessors.user("1").roles("ADMIN"))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalUsers").value(10));
    }
}
