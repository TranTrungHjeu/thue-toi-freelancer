package com.thuetoi.service;

import com.thuetoi.dto.request.MessageRequest;
import com.thuetoi.dto.response.marketplace.MessageResponse;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Message;
import com.thuetoi.enums.ContractStatus;
import com.thuetoi.enums.MessageType;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.repository.MessageRepository;
import com.thuetoi.websocket.ContractMessageWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ContractAccessService contractAccessService;

    @Autowired
    private MarketplaceResponseMapper marketplaceResponseMapper;

    @Autowired
    private ContractMessageWebSocketHandler contractMessageWebSocketHandler;

    @Autowired
    private AttachmentMetadataService attachmentMetadataService;

    @Autowired(required = false)
    private ContractRealtimePublisher contractRealtimePublisher;

    @Autowired
    private NotificationService notificationService;

    public Message sendMessage(Long currentUserId, MessageRequest request) {
        Contract contract = contractAccessService.requireAccessibleContract(request.getContractId(), currentUserId);
        if (!ContractStatus.IN_PROGRESS.matches(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể gửi tin nhắn trong hợp đồng đang thực hiện", HttpStatus.BAD_REQUEST);
        }

        MessageType messageType = normalizeMessageType(request.getMessageType());
        String normalizedContent = normalizeText(request.getContent());
        String normalizedAttachments = serializeAttachments(request.getAttachments());

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
        MessageResponse response = marketplaceResponseMapper.toMessageResponse(savedMessage);
        contractMessageWebSocketHandler.broadcast(response);

        if (contractRealtimePublisher != null) {
            contractRealtimePublisher.publish(request.getContractId(), "message.created", savedMessage);
        }

        Long recipientId = contract.getClientId().equals(currentUserId)
            ? contract.getFreelancerId()
            : contract.getClientId();
        notificationService.createNotificationForUser(
            recipientId,
            "contract",
            "Tin nhắn mới trong hợp đồng",
            "Bạn có tin nhắn mới trong contract #" + request.getContractId() + ".",
            "/workspace/contracts"
        );

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

    private String serializeAttachments(java.util.List<com.thuetoi.dto.request.FileAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return null;
        }
        return attachmentMetadataService.serialize(attachments);
    }
}
