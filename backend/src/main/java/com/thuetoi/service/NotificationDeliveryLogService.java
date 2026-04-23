package com.thuetoi.service;

import com.thuetoi.dto.response.admin.NotificationDeliveryLogResponse;
import com.thuetoi.entity.NotificationDeliveryLog;
import com.thuetoi.repository.NotificationDeliveryLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationDeliveryLogService {

    private final NotificationDeliveryLogRepository notificationDeliveryLogRepository;

    public NotificationDeliveryLogService(NotificationDeliveryLogRepository notificationDeliveryLogRepository) {
        this.notificationDeliveryLogRepository = notificationDeliveryLogRepository;
    }

    @Transactional
    public void log(Long notificationId, Long userId, String channel, String status, String detail) {
        NotificationDeliveryLog deliveryLog = new NotificationDeliveryLog();
        deliveryLog.setNotificationId(notificationId);
        deliveryLog.setUserId(userId);
        deliveryLog.setChannel(channel);
        deliveryLog.setStatus(status);
        deliveryLog.setDetail(trimDetail(detail));
        notificationDeliveryLogRepository.save(deliveryLog);
    }

    @Transactional(readOnly = true)
    public List<NotificationDeliveryLogResponse> getRecentLogs() {
        return notificationDeliveryLogRepository.findTop100ByOrderByCreatedAtDesc()
            .stream()
            .map(log -> new NotificationDeliveryLogResponse(
                log.getId(),
                log.getNotificationId(),
                log.getUserId(),
                log.getChannel(),
                log.getStatus(),
                log.getDetail(),
                log.getCreatedAt()
            ))
            .toList();
    }

    private String trimDetail(String detail) {
        if (detail == null) {
            return null;
        }
        String normalized = detail.trim();
        return normalized.length() > 500 ? normalized.substring(0, 500) : normalized;
    }
}
