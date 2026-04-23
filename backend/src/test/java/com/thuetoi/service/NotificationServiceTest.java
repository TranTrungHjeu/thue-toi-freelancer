package com.thuetoi.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.thuetoi.dto.response.marketplace.NotificationPageResponse;
import com.thuetoi.dto.response.marketplace.NotificationResponse;
import com.thuetoi.entity.Notification;
import com.thuetoi.entity.User;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationRepository;
import com.thuetoi.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void createNotificationDefaultsSystemTypeAndUnreadState() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notification notification = notificationService.createNotification(
            7L,
            "   ",
            "  Hop dong moi  ",
            "  Ban co hop dong moi  ",
            "  /workspace/contracts  "
        );

        assertThat(notification.getUserId()).isEqualTo(7L);
        assertThat(notification.getType()).isEqualTo("system");
        assertThat(notification.getTitle()).isEqualTo("Hop dong moi");
        assertThat(notification.getContent()).isEqualTo("Ban co hop dong moi");
        assertThat(notification.getLink()).isEqualTo("/workspace/contracts");
        assertThat(notification.getIsRead()).isFalse();
        verify(messagingTemplate).convertAndSendToUser(
            org.mockito.ArgumentMatchers.eq("7"),
            org.mockito.ArgumentMatchers.eq("/queue/notifications"),
            org.mockito.ArgumentMatchers.any(NotificationResponse.class)
        );
    }

    @Test
    void createNotificationRejectsInvalidType() {
        assertThatThrownBy(() -> notificationService.createNotification(7L, "email", "Title", "Content", "/link"))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void markAllAsReadOnlyUpdatesUnreadNotifications() {
        Notification first = notification(1L, 7L, false);
        Notification second = notification(2L, 7L, false);

        when(notificationRepository.findByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(7L))
            .thenReturn(List.of(first, second));

        int updatedCount = notificationService.markAllAsRead(7L);

        assertThat(updatedCount).isEqualTo(2);
        assertThat(first.getIsRead()).isTrue();
        assertThat(second.getIsRead()).isTrue();
        verify(notificationRepository).saveAll(List.of(first, second));
    }

    @Test
    void getNotificationPageAppliesTypeAndUnreadFiltersWithCounters() {
        Notification notification = notification(1L, 7L, false);
        notification.setType("bid");

        when(notificationRepository.searchUserNotifications(
            eq(7L), anyString(), eq(true), eq(false), any(String.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationRepository.countByUserIdAndDeletedAtIsNullAndArchivedAtIsNull(7L)).thenReturn(12L);
        when(notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNull(7L)).thenReturn(5L);

        NotificationPageResponse response = notificationService.getNotificationPage(7L, 0, 20, " BID ", true);

        assertThat(response.notifications()).hasSize(1);
        assertThat(response.notifications().get(0).type()).isEqualTo("bid");
        assertThat(response.totalNotifications()).isEqualTo(12L);
        assertThat(response.unreadCount()).isEqualTo(5L);
    }

    @Test
    void createNotificationForUserOnceReturnsRecentDuplicateWithoutSaving() {
        Notification duplicate = notification(9L, 7L, false);
        duplicate.setType("system");
        duplicate.setTitle("Báo cáo đã được ghi nhận");
        duplicate.setContent("Nội dung");
        duplicate.setLink("/workspace/notifications");

        when(notificationRepository.findFirstByUserIdAndTypeAndTitleAndContentAndLinkAndCreatedAtAfterOrderByCreatedAtDesc(
            eq(7L),
            eq("system"),
            eq("Báo cáo đã được ghi nhận"),
            eq("Nội dung"),
            eq("/workspace/notifications"),
            any(LocalDateTime.class)
        )).thenReturn(Optional.of(duplicate));

        Notification result = notificationService.createNotificationForUserOnce(
            7L,
            "system",
            " Báo cáo đã được ghi nhận ",
            " Nội dung ",
            " /workspace/notifications ",
            Duration.ofSeconds(30)
        );

        assertThat(result).isSameAs(duplicate);
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(messagingTemplate, never()).convertAndSendToUser(any(), any(), any());
    }

    @Test
    void broadcastNotificationStoresAndEmitsNotificationForEachTargetUser() {
        User firstAdmin = user(10L, "admin");
        User secondAdmin = user(11L, "admin");

        when(userRepository.findByRole("admin")).thenReturn(List.of(firstAdmin, secondAdmin));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.broadcastNotification(" ADMIN ", " system ", "  Có báo cáo mới  ", "  Cần xử lý  ", "  /workspace/admin/reports  ", null);

        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(messagingTemplate, times(2)).convertAndSendToUser(
            anyString(),
            eq("/queue/notifications"),
            any(NotificationResponse.class)
        );
    }

    private Notification notification(Long id, Long userId, boolean isRead) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setUserId(userId);
        notification.setType("system");
        notification.setTitle("Notification " + id);
        notification.setIsRead(isRead);
        return notification;
    }

    private User user(Long id, String role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setEmail("user" + id + "@thuetoi.test");
        user.setFullName("User " + id);
        return user;
    }
}
