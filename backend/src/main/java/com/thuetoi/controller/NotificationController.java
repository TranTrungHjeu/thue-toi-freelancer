package com.thuetoi.controller;

import com.thuetoi.dto.request.NotificationRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.NotificationResponse;
import com.thuetoi.entity.Notification;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    /**
     * Lấy tất cả notification của user hiện tại
     */
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getAllNotifications(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Notification> notifications = notificationService.getAllNotifications(currentUserId);
        return ApiResponse.success("Lấy notification của user hiện tại", marketplaceResponseMapper.toNotificationResponses(notifications));
    }

    @PostMapping
    public ApiResponse<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Notification created = notificationService.createNotification(
            currentUserId,
            request.getType(),
            request.getTitle(),
            request.getContent(),
            request.getLink()
        );
        return ApiResponse.success("Tạo thông báo thành công", marketplaceResponseMapper.toNotificationResponse(created));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<NotificationResponse>> getNotificationsByUser(@PathVariable Long userId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        if (!userId.equals(currentUserId)) {
            throw new BusinessException("ERR_AUTH_04", "Bạn không có quyền xem thông báo của người dùng khác", HttpStatus.FORBIDDEN);
        }
        List<Notification> notifications = notificationService.getNotificationsByUser(userId);
        return ApiResponse.success("Lấy notification theo userId", marketplaceResponseMapper.toNotificationResponses(notifications));
    }

    /**
     * Lấy notification của user đang đăng nhập
     */
    @GetMapping("/user/me")
    public ApiResponse<List<NotificationResponse>> getNotificationsByCurrentUser(Principal principal) {
        Long id = currentUserProvider.requireCurrentUserId(principal);
        List<Notification> notifications = notificationService.getNotificationsByUser(id);
        return ApiResponse.success("Lấy notification của user đang đăng nhập", marketplaceResponseMapper.toNotificationResponses(notifications));
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable Long notificationId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Notification updated = notificationService.markAsRead(notificationId, currentUserId);
        return ApiResponse.success("Đánh dấu thông báo đã đọc thành công", marketplaceResponseMapper.toNotificationResponse(updated));
    }
}
