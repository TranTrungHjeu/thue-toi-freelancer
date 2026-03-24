package com.thuetoi.service;

import com.thuetoi.entity.Notification;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

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
}
