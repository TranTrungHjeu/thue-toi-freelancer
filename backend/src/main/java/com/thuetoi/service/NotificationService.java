package com.thuetoi.service;

import com.thuetoi.dto.response.marketplace.NotificationPageResponse;
import com.thuetoi.dto.response.marketplace.NotificationResponse;
import com.thuetoi.entity.Notification;
import com.thuetoi.entity.User;
import com.thuetoi.enums.NotificationType;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.NotificationRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    private static final int MAX_EVENT_KEY_LENGTH = 191;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private NotificationPreferenceService notificationPreferenceService;

    @Autowired(required = false)
    private NotificationDeliveryLogService notificationDeliveryLogService;

    @Autowired(required = false)
    private EmailService emailService;

    /**
     * Lấy tất cả notification đang hoạt động.
     */
    public List<Notification> getAllNotifications(Long userId) {
        return getNotificationsByUser(userId);
    }

    @Transactional
    public Notification createNotification(Long userId, String type, String title, String content, String link) {
        NotificationType finalType = normalizeNotificationType(type);
        return createNormalizedNotification(
            userId,
            finalType.getValue(),
            requireTitle(title),
            normalizeText(content),
            normalizeText(link),
            null,
            true,
            false
        );
    }

    @Transactional
    public Notification createNotificationForUser(Long userId, String type, String title, String content, String link) {
        return createNotificationForUserWithEventKey(userId, type, title, content, link, null);
    }

    @Transactional
    public Notification createNotificationForUserWithEventKey(
        Long userId,
        String type,
        String title,
        String content,
        String link,
        String eventKey
    ) {
        NotificationType finalType = normalizeNotificationType(type);
        String normalizedType = finalType.getValue();
        String normalizedTitle = requireTitle(title);
        String normalizedContent = normalizeText(content);
        String normalizedLink = normalizeText(link);
        String normalizedEventKey = normalizeEventKey(eventKey);

        if (!isInAppEnabled(userId, normalizedType)) {
            logDelivery(null, userId, "in_app", "skipped", "User disabled in-app notifications for type " + normalizedType);
            return null;
        }

        if (normalizedEventKey != null) {
            Optional<Notification> existingNotification = notificationRepository
                .findFirstByUserIdAndEventKeyAndCreatedAtAfterOrderByCreatedAtDesc(
                    userId,
                    normalizedEventKey,
                    LocalDateTime.now().minus(Duration.ofDays(30))
                );
            if (existingNotification.isPresent()) {
                logDelivery(existingNotification.get().getId(), userId, "in_app", "skipped", "Duplicate event key: " + normalizedEventKey);
                return existingNotification.get();
            }
        }

        return createNormalizedNotification(
            userId,
            normalizedType,
            normalizedTitle,
            normalizedContent,
            normalizedLink,
            normalizedEventKey,
            true,
            true
        );
    }

    @Transactional
    public Notification createNotificationForUserOnce(
        Long userId,
        String type,
        String title,
        String content,
        String link,
        Duration deduplicationWindow
    ) {
        NotificationType finalType = normalizeNotificationType(type);
        String normalizedTitle = requireTitle(title);
        String normalizedContent = normalizeText(content);
        String normalizedLink = normalizeText(link);
        Duration safeWindow = deduplicationWindow == null || deduplicationWindow.isNegative() || deduplicationWindow.isZero()
            ? Duration.ofSeconds(30)
            : deduplicationWindow;
        Optional<Notification> recentDuplicate = notificationRepository
            .findFirstByUserIdAndTypeAndTitleAndContentAndLinkAndCreatedAtAfterOrderByCreatedAtDesc(
                userId,
                finalType.getValue(),
                normalizedTitle,
                normalizedContent,
                normalizedLink,
                LocalDateTime.now().minus(safeWindow)
            );
        if (recentDuplicate.isPresent()) {
            logDelivery(recentDuplicate.get().getId(), userId, "in_app", "skipped", "Recent duplicate content");
            return recentDuplicate.get();
        }
        return createNotificationForUserWithEventKey(userId, finalType.getValue(), normalizedTitle, normalizedContent, normalizedLink, null);
    }

    private Notification createNormalizedNotification(
        Long userId,
        String type,
        String title,
        String content,
        String link,
        String eventKey,
        boolean emitRealtime,
        boolean honorEmailPreference
    ) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setLink(link);
        notification.setEventKey(eventKey);
        notification.setIsRead(false);

        Notification savedNotification;
        try {
            savedNotification = notificationRepository.save(notification);
        } catch (DataIntegrityViolationException ex) {
            if (eventKey != null) {
                return notificationRepository
                    .findFirstByUserIdAndEventKeyAndCreatedAtAfterOrderByCreatedAtDesc(
                        userId,
                        eventKey,
                        LocalDateTime.now().minus(Duration.ofDays(30))
                    )
                    .orElseThrow(() -> ex);
            }
            throw ex;
        }

        logDelivery(savedNotification.getId(), userId, "in_app", "created", "Stored in notification inbox");
        emitRealtimeNotification(savedNotification, emitRealtime);
        deliverEmailIfEnabled(savedNotification, honorEmailPreference);
        return savedNotification;
    }

    private void emitRealtimeNotification(Notification notification, boolean emitRealtime) {
        if (!emitRealtime || messagingTemplate == null) {
            logDelivery(notification.getId(), notification.getUserId(), "websocket", "skipped", "Realtime emit disabled");
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                String.valueOf(notification.getUserId()),
                "/queue/notifications",
                toResponse(notification)
            );
            logDelivery(notification.getId(), notification.getUserId(), "websocket", "sent", "Sent to /user/queue/notifications");
        } catch (Exception ex) {
            logDelivery(notification.getId(), notification.getUserId(), "websocket", "failed", ex.getMessage());
        }
    }

    private void deliverEmailIfEnabled(Notification notification, boolean honorEmailPreference) {
        if (!honorEmailPreference || emailService == null || !isEmailEnabled(notification.getUserId(), notification.getType())) {
            notification.setEmailDeliveryStatus("skipped");
            logDelivery(notification.getId(), notification.getUserId(), "email", "skipped", "Email preference disabled or service unavailable");
            return;
        }

        Optional<User> target = userRepository.findById(notification.getUserId());
        if (target.isEmpty() || target.get().getEmail() == null || target.get().getEmail().isBlank()) {
            notification.setEmailDeliveryStatus("skipped");
            logDelivery(notification.getId(), notification.getUserId(), "email", "skipped", "Recipient email missing");
            return;
        }

        boolean sent = emailService.sendNotificationEmail(
            target.get().getEmail(),
            notification.getTitle(),
            notification.getContent(),
            notification.getLink()
        );
        notification.setEmailDeliveryStatus(sent ? "sent" : "skipped");
        if (sent) {
            notification.setEmailSentAt(LocalDateTime.now());
        }
        notificationRepository.save(notification);
        logDelivery(notification.getId(), notification.getUserId(), "email", sent ? "sent" : "skipped", sent ? "Email sent" : "Email not sent");
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserIdAndDeletedAtIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationPage(Long userId, int page, int size, String type, boolean unreadOnly) {
        return getNotificationPage(userId, page, size, type, unreadOnly, false, null);
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationPage(
        Long userId,
        int page,
        int size,
        String type,
        boolean unreadOnly,
        boolean archived,
        String query
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        String normalizedType = normalizeOptionalNotificationType(type);
        String normalizedQuery = normalizeText(query);
        Pageable pageable = PageRequest.of(
            safePage,
            safeSize,
            Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Page<Notification> notificationPage = notificationRepository.searchUserNotifications(
            userId,
            normalizedType,
            unreadOnly,
            archived,
            normalizedQuery,
            pageable
        );

        return new NotificationPageResponse(
            notificationPage.getContent().stream().map(this::toResponse).toList(),
            notificationPage.getNumber(),
            notificationPage.getSize(),
            notificationPage.getTotalElements(),
            notificationPage.getTotalPages(),
            notificationRepository.countByUserIdAndDeletedAtIsNullAndArchivedAtIsNull(userId),
            notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNull(userId)
        );
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long currentUserId) {
        Notification notification = requireOwnedNotification(notificationId, currentUserId);
        notification.setIsRead(true);
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseAndDeletedAtIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(userId);
        unread.forEach(n -> {
            n.setIsRead(true);
            if (n.getReadAt() == null) {
                n.setReadAt(LocalDateTime.now());
            }
        });
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public Notification archiveNotification(Long notificationId, Long currentUserId) {
        Notification notification = requireOwnedNotification(notificationId, currentUserId);
        if (notification.getArchivedAt() == null) {
            notification.setArchivedAt(LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long currentUserId) {
        Notification notification = requireOwnedNotification(notificationId, currentUserId);
        if (notification.getDeletedAt() == null) {
            notification.setDeletedAt(LocalDateTime.now());
        }
        notificationRepository.save(notification);
    }

    @Transactional
    public void broadcastNotification(String targetRole, String type, String title, String content, String link, Long currentAdminId) {
        List<User> targets;
        if (targetRole == null || targetRole.trim().isEmpty() || targetRole.equalsIgnoreCase("all")) {
            targets = userRepository.findAll();
        } else {
            targets = userRepository.findByRole(targetRole.toLowerCase().trim());
        }

        if (targets.isEmpty()) {
            return;
        }

        String finalType = normalizeNotificationType(type).getValue();
        String normalizedTitle = requireTitle(title);
        String normalizedContent = normalizeText(content);
        String normalizedLink = normalizeText(link);

        List<Notification> savedNotifications = targets.stream()
            .filter(user -> isInAppEnabled(user.getId(), finalType) ||
                (currentAdminId != null && currentAdminId.equals(user.getId())))
            .map(user -> createNormalizedNotification(
                user.getId(),
                finalType,
                normalizedTitle,
                normalizedContent,
                normalizedLink,
                null,
                true,
                true
            ))
            .filter(notification -> notification != null)
            .toList();

        targets.stream()
            .filter(user -> !isInAppEnabled(user.getId(), finalType) &&
                !(currentAdminId != null && currentAdminId.equals(user.getId())))
            .forEach(user -> logDelivery(null, user.getId(), "in_app", "skipped", "User disabled broadcast type " + finalType));

        if (messagingTemplate != null && !savedNotifications.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/global-notifications", "NEW_BROADCAST");
        }
    }

    private Notification requireOwnedNotification(Long notificationId, Long currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new BusinessException("ERR_NOTIFICATION_01", "Không tìm thấy thông báo", HttpStatus.NOT_FOUND));
        if (!notification.getUserId().equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền cập nhật thông báo này", HttpStatus.FORBIDDEN);
        }
        if (notification.getDeletedAt() != null) {
            throw new BusinessException("ERR_NOTIFICATION_01", "Không tìm thấy thông báo", HttpStatus.NOT_FOUND);
        }
        return notification;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String requireTitle(String title) {
        String normalizedTitle = normalizeText(title);
        if (normalizedTitle == null || normalizedTitle.isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tiêu đề thông báo không được để trống", HttpStatus.BAD_REQUEST);
        }
        return normalizedTitle;
    }

    private NotificationType normalizeNotificationType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return NotificationType.SYSTEM;
        }
        return NotificationType.fromValue(type)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Loại thông báo không hợp lệ", HttpStatus.BAD_REQUEST));
    }

    private String normalizeOptionalNotificationType(String type) {
        if (type == null || type.trim().isEmpty() || "all".equalsIgnoreCase(type.trim())) {
            return null;
        }
        return normalizeNotificationType(type).getValue();
    }

    private String normalizeEventKey(String eventKey) {
        String normalized = normalizeText(eventKey);
        if (normalized == null) {
            return null;
        }
        return normalized.length() > MAX_EVENT_KEY_LENGTH ? normalized.substring(0, MAX_EVENT_KEY_LENGTH) : normalized;
    }

    private boolean isInAppEnabled(Long userId, String type) {
        return notificationPreferenceService == null || notificationPreferenceService.isInAppEnabled(userId, type);
    }

    private boolean isEmailEnabled(Long userId, String type) {
        return notificationPreferenceService != null && notificationPreferenceService.isEmailEnabled(userId, type);
    }

    private void logDelivery(Long notificationId, Long userId, String channel, String status, String detail) {
        if (notificationDeliveryLogService != null) {
            notificationDeliveryLogService.log(notificationId, userId, channel, status, detail);
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getUserId(),
            notification.getType(),
            notification.getTitle(),
            notification.getContent(),
            notification.getLink(),
            notification.getIsRead(),
            notification.getCreatedAt()
        );
    }
}
