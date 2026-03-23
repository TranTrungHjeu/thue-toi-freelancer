package com.thuetoi.service;

import com.thuetoi.dto.request.MessageRequest;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Message;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MessageService {
    private static final Set<String> ALLOWED_MESSAGE_TYPES = Set.of("text", "file");

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ContractAccessService contractAccessService;

    public Message sendMessage(Long currentUserId, MessageRequest request) {
        Contract contract = contractAccessService.requireAccessibleContract(request.getContractId(), currentUserId);
        if (!"in_progress".equalsIgnoreCase(contract.getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Chỉ có thể gửi tin nhắn trong hợp đồng đang thực hiện", HttpStatus.BAD_REQUEST);
        }

        String messageType = normalizeMessageType(request.getMessageType());
        String normalizedContent = normalizeText(request.getContent());
        String normalizedAttachments = normalizeText(request.getAttachments());

        if ("text".equals(messageType) && normalizedContent == null) {
            throw new BusinessException("ERR_SYS_02", "Tin nhắn văn bản không được để trống nội dung", HttpStatus.BAD_REQUEST);
        }
        if ("file".equals(messageType) && normalizedAttachments == null) {
            throw new BusinessException("ERR_SYS_02", "Tin nhắn file phải có tệp đính kèm", HttpStatus.BAD_REQUEST);
        }

        Message message = new Message();
        message.setContractId(request.getContractId());
        message.setSenderId(currentUserId);
        message.setMessageType(messageType);
        message.setContent(normalizedContent);
        message.setAttachments(normalizedAttachments);
        return messageRepository.save(message);
    }

    public List<Message> getMessagesByContract(Long contractId, Long currentUserId) {
        contractAccessService.requireAccessibleContract(contractId, currentUserId);
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
    }

    private String normalizeMessageType(String messageType) {
        if (messageType == null || messageType.trim().isEmpty()) {
            return "text";
        }

        String normalizedType = messageType.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_MESSAGE_TYPES.contains(normalizedType)) {
            throw new BusinessException("ERR_SYS_02", "Loại tin nhắn không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return normalizedType;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
