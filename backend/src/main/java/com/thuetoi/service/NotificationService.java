package com.thuetoi.service;

import com.thuetoi.entity.Notification;
import com.thuetoi.entity.User;
import com.thuetoi.enums.NotificationType;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy tất cả notification
     */
    public List<Notification> getAllNotifications(Long userId) {
        return getNotificationsByUser(userId);
    }

    public Notification createNotification(Long userId, String type, String title, String content, String link) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title == null ? null : title.trim());
        notification.setContent(normalizeText(content));
        notification.setLink(normalizeText(link));

        if (notification.getTitle() == null || notification.getTitle().isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề thông báo không được để trống", HttpStatus.BAD_REQUEST);
        }
        notification.setType(normalizeNotificationType(type).getValue());
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        Notification savedNotification = notificationRepository.save(notification);

        // Broadcast realtime notification qua WebSocket
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSendToUser(
                String.valueOf(userId), "/queue/notifications", savedNotification);
        }

        return savedNotification;
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

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void broadcastNotification(String targetRole, String type, String title, String content, String link) {
        List<User> targets;
        if (targetRole == null || targetRole.trim().isEmpty() || targetRole.equalsIgnoreCase("all")) {
            targets = userRepository.findAll();
        } else {
            targets = userRepository.findByRole(targetRole.toLowerCase().trim());
        }

        if (targets.isEmpty()) return;

        String finalType = normalizeNotificationType(type).getValue();
        List<Notification> notifications = targets.stream().map(u -> {
            Notification n = new Notification();
            n.setUserId(u.getId());
            n.setType(finalType);
            n.setTitle(title);
            n.setContent(content);
            n.setLink(link);
            n.setIsRead(false);
            return n;
        }).toList();

        notificationRepository.saveAll(notifications);

        // Phát tín hiệu thông báo mới cho client nếu cần (có thể dùng topic /topic/global-notifications)
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/global-notifications", "NEW_BROADCAST");
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private NotificationType normalizeNotificationType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return NotificationType.SYSTEM;
        }
        return NotificationType.fromValue(type)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Loại thông báo không hợp lệ", HttpStatus.BAD_REQUEST));
    }
}
