package com.thuetoi.controller;

import com.thuetoi.entity.Notification;
import com.thuetoi.service.NotificationService;
import com.thuetoi.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ApiResponse createNotification(@RequestBody Notification notification) {
        Notification created = notificationService.createNotification(notification);
        return ApiResponse.success(created);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse getNotificationsByUser(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUser(userId);
        return ApiResponse.success(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse markAsRead(@PathVariable Long notificationId) {
        Notification updated = notificationService.markAsRead(notificationId);
        return ApiResponse.success(updated);
    }
}
