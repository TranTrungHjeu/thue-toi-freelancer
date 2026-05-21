package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * DTO gửi tin nhắn trong hợp đồng.
 */
@Data
public class MessageRequest {
    private Long contractId;

    private Long recipientId;

    private String messageType;
    private String content;
    private List<FileAttachmentRequest> attachments;

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }
    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<FileAttachmentRequest> getAttachments() { return attachments; }
    public void setAttachments(List<FileAttachmentRequest> attachments) { this.attachments = attachments; }
}
