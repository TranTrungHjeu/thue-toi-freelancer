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
import com.thuetoi.repository.UserRepository;
import com.thuetoi.websocket.ContractMessageWebSocketHandler;
import com.thuetoi.websocket.SupportMessageWebSocketHandler;
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
    private SupportMessageWebSocketHandler supportMessageWebSocketHandler;

    @Autowired
    private AttachmentMetadataService attachmentMetadataService;

    @Autowired(required = false)
    private ContractRealtimePublisher contractRealtimePublisher;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public Message sendMessage(Long currentUserId, MessageRequest request) {
        Long contractId = request.getContractId();
        Long recipientId = request.getRecipientId();

        if (contractId != null) {
            return sendContractMessage(currentUserId, contractId, request);
        } else {
            return sendSupportMessage(currentUserId, recipientId, request);
        }
    }

    private Message sendContractMessage(Long currentUserId, Long contractId, MessageRequest request) {
        Contract contract = contractAccessService.requireAccessibleContract(contractId, currentUserId);

        if (contract == null || !ContractStatus.IN_PROGRESS.matches(contract.getStatus())) {
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
        message.setContractId(contractId);
        message.setSenderId(currentUserId);
        message.setMessageType(messageType.getValue());
        message.setContent(normalizedContent);
        message.setAttachments(normalizedAttachments);

        Message savedMessage = messageRepository.save(message);
        String senderRole = userRepository.findById(currentUserId)
            .map(com.thuetoi.entity.User::getRole)
            .orElse("user");
        MessageResponse response = marketplaceResponseMapper.toMessageResponse(savedMessage, senderRole);

        Long recipientId = contract.getClientId().equals(currentUserId)
            ? contract.getFreelancerId()
            : contract.getClientId();
        savedMessage.setRecipientId(recipientId);
        messageRepository.save(savedMessage);

        if (normalizedContent != null && normalizedContent.startsWith("[CALL_INVITATION]")) {
            String callType = normalizedContent.contains("Video") ? "Video" : "Thoại";
            notificationService.createNotificationForUser(
                recipientId,
                "call",
                "Cuộc gọi đến từ đối tác",
                callType + "|" + contractId + "|" + currentUserId,
                "/workspace/contracts?contractId=" + contractId
            );
        }

        contractMessageWebSocketHandler.broadcast(response);

        if (contractRealtimePublisher != null) {
            contractRealtimePublisher.publish(contractId, "message.created", savedMessage);
        }

        if (normalizedContent == null || !normalizedContent.startsWith("[CALL_INVITATION]")) {
            notificationService.createNotificationForUser(
                recipientId,
                "contract",
                "Tin nhắn mới trong hợp đồng",
                "Bạn có tin nhắn mới trong contract #" + contractId + ".",
                "/workspace/contracts"
            );
        }

        return savedMessage;
    }

    public List<Message> getMessagesByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
    }

    private Message sendSupportMessage(Long currentUserId, Long recipientId, MessageRequest request) {
        if (recipientId == null) {
            // Tìm admin đầu tiên làm người nhận mặc định cho user
            recipientId = userRepository.findByRole("admin").stream()
                .findFirst()
                .map(com.thuetoi.entity.User::getId)
                .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy Admin để hỗ trợ", HttpStatus.NOT_FOUND));
        }

        MessageType messageType = normalizeMessageType(request.getMessageType());
        String normalizedContent = normalizeText(request.getContent());
        String normalizedAttachments = serializeAttachments(request.getAttachments());

        if (messageType == MessageType.TEXT && normalizedContent == null) {
            throw new BusinessException("ERR_SYS_02", "Tin nhắn văn bản không được để trống nội dung", HttpStatus.BAD_REQUEST);
        }

        Message message = new Message();
        message.setSenderId(currentUserId);
        message.setRecipientId(recipientId);
        message.setMessageType(messageType.getValue());
        message.setContent(normalizedContent);
        message.setAttachments(normalizedAttachments);

        Message savedMessage = messageRepository.save(message);
        String senderRole = userRepository.findById(currentUserId)
            .map(com.thuetoi.entity.User::getRole)
            .orElse("user");
        MessageResponse response = marketplaceResponseMapper.toMessageResponse(savedMessage, senderRole);

        // Phát tín hiệu realtime
        supportMessageWebSocketHandler.broadcast(response);

        notificationService.createNotificationForUser(
            recipientId,
            "system",
            "Tin nhắn hỗ trợ mới",
            "Bạn có tin nhắn hỗ trợ mới.",
            "/admin/support"
        );

        return savedMessage;
    }

    public List<Message> getSupportMessages(Long adminId, Long userId) {
        // Nếu adminId null, có nghĩa là user đang gọi để lấy chat của mình với admin
        if (adminId == null) {
            adminId = userRepository.findByRole("admin").stream()
                .findFirst()
                .map(com.thuetoi.entity.User::getId)
                .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy Admin", HttpStatus.NOT_FOUND));
            return messageRepository.findSupportMessagesBetween(userId, adminId);
        }
        // Nếu adminId không null, admin đang lấy chat với user
        return messageRepository.findSupportMessagesBetween(adminId, userId);
    }

    public Message sendSupportMessageToAdmin(Long currentUserId, MessageRequest request) {
        return sendSupportMessage(currentUserId, null, request);
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
