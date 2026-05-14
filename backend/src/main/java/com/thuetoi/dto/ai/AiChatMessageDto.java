package com.thuetoi.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiChatMessageDto {

    @NotBlank
    @Pattern(regexp = "(?i)^(user|assistant)$")
    private String role;

    @NotBlank
    @Size(max = 8000)
    private String content;
}
