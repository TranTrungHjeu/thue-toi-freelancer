package com.thuetoi.service;

import com.thuetoi.entity.Notification;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Lấy tất cả notification
     */
    public List<Notification> getAllNotifications(Long userId) {
        return getNotificationsByUser(userId);
    }

    public Notification createNotification(Long userId, String type, String title, String content, String link) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title == null ? null : title.trim());
        notification.setContent(normalizeText(content));
        notification.setLink(normalizeText(link));

        if (notification.getTitle() == null || notification.getTitle().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề thông báo không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (notification.getType() == null || notification.getType().trim().isEmpty()) {
            notification.setType("system");
        } else {
            notification.setType(notification.getType().trim().toLowerCase(Locale.ROOT));
        }
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification createNotificationForUser(Long userId, String type, String title, String content, String link) {
        return createNotification(userId, type, title, content, link);
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new BusinessException("ERR_NOTIFICATION_01", "Không tìm thấy thông báo", HttpStatus.NOT_FOUND));
        if (!notification.getUserId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền cập nhật thông báo này", HttpStatus.FORBIDDEN);
        }
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
