package com.thuetoi.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * Realtime publisher cho luồng rút tiền: phát sự kiện qua STOMP để FE
 * tự refresh danh sách mà không cần user/admin bấm "làm mới".
 *
 * <p>Topic được sử dụng:</p>
 * <ul>
 *   <li><code>/topic/withdrawals/user/{userId}</code> - dành cho user xem yêu cầu của
 *       chính mình; chỉ phát event metadata (id, type), FE refetch danh sách qua REST
 *       để đảm bảo bảo mật.</li>
 *   <li><code>/topic/withdrawals/admin</code> - "ping" cho admin biết có thay đổi để
 *       refetch danh sách. Không chứa dữ liệu nhạy cảm.</li>
 * </ul>
 *
 * <p><b>Event types:</b> {@code created}, {@code cancelled}, {@code rejected},
 * {@code completed}, {@code updated}.</p>
 */
@Slf4j
@Service
public class WithdrawalRealtimePublisher {

    public static final String TYPE_CREATED = "created";
    public static final String TYPE_CANCELLED = "cancelled";
    public static final String TYPE_REJECTED = "rejected";
    public static final String TYPE_COMPLETED = "completed";
    public static final String TYPE_UPDATED = "updated";

    private final SimpMessagingTemplate messagingTemplate;

    public WithdrawalRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Phát đồng thời sự kiện tới user sở hữu yêu cầu và channel admin.
     * Lỗi gửi message không được phép phá vỡ transaction nghiệp vụ.
     */
    public void publish(Long userId, Long withdrawalId, String type) {
        if (type == null || type.isBlank()) {
            return;
        }
        Map<String, Object> payload = buildPayload(withdrawalId, type);

        if (userId != null) {
            safeSend("/topic/withdrawals/user/" + userId, payload);
        }
        safeSend("/topic/withdrawals/admin", payload);
    }

    private Map<String, Object> buildPayload(Long withdrawalId, String type) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("withdrawalId", withdrawalId);
        payload.put("ts", Instant.now().toEpochMilli());
        return payload;
    }

    private void safeSend(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception ex) {
            log.warn("[WithdrawalRealtimePublisher] không thể publish tới {}: {}", destination, ex.getMessage());
        }
    }
}
