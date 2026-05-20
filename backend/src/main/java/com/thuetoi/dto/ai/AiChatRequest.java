package com.thuetoi.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AiChatRequest {

    @NotEmpty
    @Size(max = 48)
    @Valid
    private List<AiChatMessageDto> messages;
}
