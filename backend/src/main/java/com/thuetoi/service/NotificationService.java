package com.thuetoi.service;

import com.thuetoi.entity.Notification;
import com.thuetoi.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findAll(); // TODO: filter by user
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setIsRead(true);
            return notificationRepository.save(notification);
        }
        return null;
    }
}
