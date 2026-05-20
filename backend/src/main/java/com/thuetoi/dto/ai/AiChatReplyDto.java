package com.thuetoi.dto.ai;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatReplyDto {
    private String reply;
    private List<AiChatResultItem> items;

    public AiChatReplyDto(String reply) {
        this.reply = reply;
        this.items = List.of();
    }
}
