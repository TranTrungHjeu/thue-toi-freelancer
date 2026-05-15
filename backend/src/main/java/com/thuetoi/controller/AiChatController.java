package com.thuetoi.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.ai.AiChatReplyDto;
import com.thuetoi.dto.ai.AiChatRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.AiChatService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/ai")
public class AiChatController {

    private final AiChatService aiChatService;
    private final CurrentUserProvider currentUserProvider;

    public AiChatController(AiChatService aiChatService, CurrentUserProvider currentUserProvider) {
        this.aiChatService = aiChatService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/chat")
    public ApiResponse<AiChatReplyDto> chat(@Valid @RequestBody AiChatRequest request, Principal principal) {
        currentUserProvider.requireCurrentUserId(principal);
        String reply = aiChatService.reply(request.getMessages());
        return ApiResponse.success("OK", new AiChatReplyDto(reply));
    }
}
