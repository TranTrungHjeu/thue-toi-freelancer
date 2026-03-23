package com.thuetoi.service;

import com.thuetoi.entity.Message;
import com.thuetoi.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;

    public Message sendMessage(Message message) {
        return messageRepository.save(message);
    }

    public List<Message> getMessagesByContract(Long contractId) {
        return messageRepository.findByContractIdOrderBySentAtAsc(contractId);
    }
}
