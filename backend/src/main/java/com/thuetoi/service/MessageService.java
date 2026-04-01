package com.thuetoi.service;

import com.thuetoi.dto.request.MessageRequest;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Message;
import com.thuetoi.enums.ContractStatus;
import com.thuetoi.enums.MessageType;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ContractAccessService contractAccessService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Message sendMessage(Long currentUserId, MessageRequest request) {
        Contract contract = contractAccessService.requireAccessibleContract(request.getContractId(), currentUserId);
        if (!ContractStatus.IN_PROGRESS.matches(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể gửi tin nhắn trong hợp đồng đang thực hiện", HttpStatus.BAD_REQUEST);
        }

        MessageType messageType = normalizeMessageType(request.getMessageType());
        String normalizedContent = normalizeText(request.getContent());
        String normalizedAttachments = normalizeText(request.getAttachments());

        if (messageType == MessageType.TEXT && normalizedContent == null) {
            throw new BusinessException("ERR_SYS_02", "Tin nhắn văn bản không được để trống nội dung", HttpStatus.BAD_REQUEST);
        }
        if (messageType == MessageType.FILE && normalizedAttachments == null) {
            throw new BusinessException("ERR_SYS_02", "Tin nhắn file phải có tệp đính kèm", HttpStatus.BAD_REQUEST);
        }

        Message message = new Message();
        message.setContractId(request.getContractId());
        message.setSenderId(currentUserId);
        message.setMessageType(messageType.getValue());
        message.setContent(normalizedContent);
        message.setAttachments(normalizedAttachments);
        Message savedMessage = messageRepository.save(message);

        // Broadcast realtime qua WebSocket cho các participant
        messagingTemplate.convertAndSend("/topic/contract/" + request.getContractId(), savedMessage);

        return savedMessage;
    }

    public List<Message> getMessagesByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
    }

    private MessageType normalizeMessageType(String messageType) {
        if (messageType == null || messageType.trim().isEmpty()) {
            return MessageType.TEXT;
        }
        return MessageType.fromValue(messageType)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Loại tin nhắn không hợp lệ", HttpStatus.BAD_REQUEST));
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
