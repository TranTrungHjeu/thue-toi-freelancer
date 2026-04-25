package com.thuetoi.service;

import com.thuetoi.dto.request.MessageRequest;
import com.thuetoi.dto.request.FileAttachmentRequest;
import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Message;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ContractAccessService contractAccessService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AttachmentMetadataService attachmentMetadataService;

    @InjectMocks
    private MessageService messageService;

    @Test
    void sendMessageUsesCurrentUserAsSenderAndNormalizesTextPayload() {
        MessageRequest request = new MessageRequest();
        request.setContractId(5L);
        request.setContent("  Xin chao client  ");

        Contract contract = contract(5L, "in_progress");
        when(contractAccessService.requireAccessibleContract(5L, 9L)).thenReturn(contract);
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Message message = messageService.sendMessage(9L, request);

        assertThat(message.getContractId()).isEqualTo(5L);
        assertThat(message.getSenderId()).isEqualTo(9L);
        assertThat(message.getMessageType()).isEqualTo("text");
        assertThat(message.getContent()).isEqualTo("Xin chao client");
        assertThat(message.getAttachments()).isNull();
        verify(notificationService).createNotificationForUser(
            1L,
            "contract",
            "Tin nhắn mới trong hợp đồng",
            "Bạn có tin nhắn mới trong contract #5.",
            "/workspace/contracts"
        );
    }

    @Test
    void sendMessageRejectsFinishedContract() {
        MessageRequest request = new MessageRequest();
        request.setContractId(5L);
        request.setContent("Message after done");

        when(contractAccessService.requireAccessibleContract(5L, 9L)).thenReturn(contract(5L, "completed"));

        assertThatThrownBy(() -> messageService.sendMessage(9L, request))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void sendMessageRejectsFileMessageWithoutAttachment() {
        MessageRequest request = new MessageRequest();
        request.setContractId(5L);
        request.setMessageType("file");

        when(contractAccessService.requireAccessibleContract(5L, 9L)).thenReturn(contract(5L, "in_progress"));

        assertThatThrownBy(() -> messageService.sendMessage(9L, request))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> {
                BusinessException ex = (BusinessException) throwable;
                assertThat(ex.getCode()).isEqualTo("ERR_SYS_02");
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            });

        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void sendMessageStoresFileMetadataJsonForFileMessage() {
        MessageRequest request = new MessageRequest();
        request.setContractId(5L);
        request.setMessageType("file");
        request.setAttachments(List.of(attachment()));

        Contract contract = contract(5L, "in_progress");
        when(contractAccessService.requireAccessibleContract(5L, 9L)).thenReturn(contract);
        when(attachmentMetadataService.serialize(request.getAttachments())).thenReturn("[{\"url\":\"https://res.cloudinary.com/demo/file.pdf\"}]");
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Message message = messageService.sendMessage(9L, request);

        assertThat(message.getMessageType()).isEqualTo("file");
        assertThat(message.getAttachments()).isEqualTo("[{\"url\":\"https://res.cloudinary.com/demo/file.pdf\"}]");
        verify(notificationService).createNotificationForUser(
            1L,
            "contract",
            "Tin nhắn mới trong hợp đồng",
            "Bạn có tin nhắn mới trong contract #5.",
            "/workspace/contracts"
        );
    }

    private Contract contract(Long id, String status) {
        Contract contract = new Contract();
        contract.setId(id);
        contract.setStatus(status);
        contract.setClientId(1L);
        contract.setFreelancerId(9L);
        return contract;
    }

    private FileAttachmentRequest attachment() {
        FileAttachmentRequest attachment = new FileAttachmentRequest();
        attachment.setUrl("https://res.cloudinary.com/demo/file.pdf");
        attachment.setName("file.pdf");
        attachment.setContentType("application/pdf");
        attachment.setSize(1200L);
        return attachment;
    }
}
