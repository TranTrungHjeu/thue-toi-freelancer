package com.thuetoi.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public PaymentRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishStatusUpdate(String orderCode, String status, Long projectId) {
        if (orderCode == null) return;

        PaymentStatusEvent event = new PaymentStatusEvent(orderCode, status, projectId);
        // Gửi tới topic chung hoặc topic cụ thể theo order code
        messagingTemplate.convertAndSend("/topic/payments/" + orderCode, event);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PaymentStatusEvent {
        private String orderCode;
        private String status;
        private Long projectId;
    }
}
