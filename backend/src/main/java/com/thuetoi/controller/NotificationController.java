package com.thuetoi.controller;

import com.thuetoi.entity.Notification;
import com.thuetoi.service.NotificationService;
import com.thuetoi.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    /**
     * Lấy tất cả notification
     */
    @GetMapping
    public ApiResponse<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ApiResponse.success("Lấy tất cả notification", notifications);
    }

    @PostMapping
    public ApiResponse createNotification(@RequestBody Notification notification) {
        Notification created = notificationService.createNotification(notification);
        return ApiResponse.success(created);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Notification>> getNotificationsByUser(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getNotificationsByUser(userId);
        return ApiResponse.success("Lấy notification theo userId", notifications);
    }

    /**
     * Lấy notification của user đang đăng nhập
     */
    @GetMapping("/user/me")
    public ApiResponse<List<Notification>> getNotificationsByCurrentUser(java.security.Principal principal) {
        if (principal == null) {
            return ApiResponse.error("ERR_AUTH_01", "Người dùng chưa đăng nhập");
        }
        Long id;
        try {
            id = Long.parseLong(principal.getName());
        } catch (Exception e) {
            return ApiResponse.error("ERR_AUTH_12", "Access token không hợp lệ");
        }
        List<Notification> notifications = notificationService.getNotificationsByUser(id);
        return ApiResponse.success("Lấy notification của user đang đăng nhập", notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse markAsRead(@PathVariable Long notificationId) {
        Notification updated = notificationService.markAsRead(notificationId);
        return ApiResponse.success(updated);
    }
}
