package com.thuetoi.controller;

import com.thuetoi.entity.Message;
import com.thuetoi.service.MessageService;
import com.thuetoi.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @PostMapping
    public ApiResponse sendMessage(@RequestBody Message message) {
        Message sent = messageService.sendMessage(message);
        return ApiResponse.success(sent);
    }

    @GetMapping("/contract/{contractId}")
    public ApiResponse getMessagesByContract(@PathVariable Long contractId) {
        List<Message> messages = messageService.getMessagesByContract(contractId);
        return ApiResponse.success(messages);
    }
}
