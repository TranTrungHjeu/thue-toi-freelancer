package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * DTO gửi tin nhắn trong hợp đồng.
 */
@Data
public class MessageRequest {
    @NotNull(message = "Hợp đồng không được để trống")
    private Long contractId;

    private String messageType;
    private String content;
    private List<FileAttachmentRequest> attachments;

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<FileAttachmentRequest> getAttachments() { return attachments; }
    public void setAttachments(List<FileAttachmentRequest> attachments) { this.attachments = attachments; }
}
