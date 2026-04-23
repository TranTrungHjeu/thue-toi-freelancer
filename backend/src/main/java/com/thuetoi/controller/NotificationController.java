package com.thuetoi.controller;

import com.thuetoi.dto.request.NotificationRequest;
import com.thuetoi.dto.request.NotificationPreferenceRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.NotificationPageResponse;
import com.thuetoi.dto.response.marketplace.NotificationPreferenceResponse;
import com.thuetoi.dto.response.marketplace.NotificationReadAllResponse;
import com.thuetoi.dto.response.marketplace.NotificationResponse;
import com.thuetoi.entity.Notification;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.NotificationPreferenceService;
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

    @Autowired
    private NotificationPreferenceService notificationPreferenceService;

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

    @GetMapping("/user/me/page")
    public ApiResponse<NotificationPageResponse> getCurrentUserNotificationPage(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "false") boolean unreadOnly,
        @RequestParam(defaultValue = "false") boolean archived,
        @RequestParam(required = false) String q,
        Principal principal
    ) {
        Long id = currentUserProvider.requireCurrentUserId(principal);
        NotificationPageResponse response = notificationService.getNotificationPage(id, page, size, type, unreadOnly, archived, q);
        return ApiResponse.success("Lấy trang notification của user đang đăng nhập", response);
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable Long notificationId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Notification updated = notificationService.markAsRead(notificationId, currentUserId);
        return ApiResponse.success("Đánh dấu thông báo đã đọc thành công", marketplaceResponseMapper.toNotificationResponse(updated));
    }

    @PutMapping("/read-all")
    public ApiResponse<NotificationReadAllResponse> markAllAsRead(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        int updatedCount = notificationService.markAllAsRead(currentUserId);
        return ApiResponse.success("Đánh dấu tất cả thông báo đã đọc thành công", new NotificationReadAllResponse(updatedCount));
    }

    @PutMapping("/{notificationId}/archive")
    public ApiResponse<NotificationResponse> archiveNotification(@PathVariable Long notificationId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Notification updated = notificationService.archiveNotification(notificationId, currentUserId);
        return ApiResponse.success("Lưu trữ thông báo thành công", marketplaceResponseMapper.toNotificationResponse(updated));
    }

    @DeleteMapping("/{notificationId}")
    public ApiResponse<Void> deleteNotification(@PathVariable Long notificationId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        notificationService.deleteNotification(notificationId, currentUserId);
        return ApiResponse.success("Xóa thông báo thành công", null);
    }

    @GetMapping("/preferences")
    public ApiResponse<List<NotificationPreferenceResponse>> getPreferences(Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        return ApiResponse.success("Tùy chọn thông báo", notificationPreferenceService.getPreferences(currentUserId));
    }

    @PutMapping("/preferences/{type}")
    public ApiResponse<NotificationPreferenceResponse> updatePreference(
        @PathVariable String type,
        @RequestBody NotificationPreferenceRequest request,
        Principal principal
    ) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        NotificationPreferenceResponse response = notificationPreferenceService.updatePreference(currentUserId, type, request);
        return ApiResponse.success("Cập nhật tùy chọn thông báo thành công", response);
    }
}
