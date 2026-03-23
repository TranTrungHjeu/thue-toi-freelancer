package com.thuetoi.service;

import com.thuetoi.dto.request.MessageRequest;
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

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ContractAccessService contractAccessService;

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
        request.setAttachments("   ");

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

    private Contract contract(Long id, String status) {
        Contract contract = new Contract();
        contract.setId(id);
        contract.setStatus(status);
        contract.setClientId(1L);
        contract.setFreelancerId(9L);
        return contract;
    }
}
