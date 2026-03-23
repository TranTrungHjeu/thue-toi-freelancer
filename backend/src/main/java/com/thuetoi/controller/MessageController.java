package com.thuetoi.controller;

import com.thuetoi.dto.request.MessageRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.Message;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @PostMapping
    public ApiResponse<Message> sendMessage(@Valid @RequestBody MessageRequest request, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        Message sent = messageService.sendMessage(currentUserId, request);
        return ApiResponse.success("Gửi tin nhắn thành công", sent);
    }

    @GetMapping("/contract/{contractId}")
    public ApiResponse<List<Message>> getMessagesByContract(@PathVariable Long contractId, Principal principal) {
        Long currentUserId = currentUserProvider.requireCurrentUserId(principal);
        List<Message> messages = messageService.getMessagesByContract(contractId, currentUserId);
        return ApiResponse.success("Lấy danh sách tin nhắn thành công", messages);
    }
}
