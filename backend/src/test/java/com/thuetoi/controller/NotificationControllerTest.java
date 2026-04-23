package com.thuetoi.controller;

import java.security.Principal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.NotificationPageResponse;
import com.thuetoi.dto.response.marketplace.NotificationReadAllResponse;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private NotificationController notificationController;

    private final Principal principal = () -> "7";

    @BeforeEach
    void setUp() {
        notificationController = new NotificationController();
        ReflectionTestUtils.setField(notificationController, "notificationService", notificationService);
        ReflectionTestUtils.setField(notificationController, "currentUserProvider", currentUserProvider);
        ReflectionTestUtils.setField(notificationController, "marketplaceResponseMapper", new MarketplaceResponseMapper());
    }

    @Test
    void markAllAsReadReturnsUpdatedCountForCurrentUser() {
        when(currentUserProvider.requireCurrentUserId(principal)).thenReturn(7L);
        when(notificationService.markAllAsRead(7L)).thenReturn(3);

        ApiResponse<NotificationReadAllResponse> response = notificationController.markAllAsRead(principal);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().updatedCount()).isEqualTo(3);
        verify(notificationService).markAllAsRead(7L);
    }

    @Test
    void getNotificationsByUserRejectsOtherUser() {
        when(currentUserProvider.requireCurrentUserId(principal)).thenReturn(7L);

        assertThatThrownBy(() -> notificationController.getNotificationsByUser(8L, principal))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_AUTH_04"));
    }

    @Test
    void getCurrentUserNotificationPageDelegatesToService() {
        NotificationPageResponse pageResponse = new NotificationPageResponse(List.of(), 0, 20, 0, 0, 12, 4);
        when(currentUserProvider.requireCurrentUserId(principal)).thenReturn(7L);
        when(notificationService.getNotificationPage(7L, 0, 20, "system", true, false, null)).thenReturn(pageResponse);

        ApiResponse<NotificationPageResponse> response = notificationController.getCurrentUserNotificationPage(
            0,
            20,
            "system",
            true,
            false, // archived
            null,  // q
            principal
        );

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData().unreadCount()).isEqualTo(4);
        verify(notificationService).getNotificationPage(7L, 0, 20, "system", true, false, null);
    }
}
