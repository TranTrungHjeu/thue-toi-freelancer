package com.thuetoi.service;

import com.thuetoi.dto.response.realtime.ContractRealtimeEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ContractRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public ContractRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(Long contractId, String type, Object payload) {
        if (contractId == null || type == null || type.isBlank()) {
            return;
        }

        messagingTemplate.convertAndSend(
            "/topic/contract/" + contractId,
            new ContractRealtimeEvent(type, contractId, payload)
        );
    }
}
