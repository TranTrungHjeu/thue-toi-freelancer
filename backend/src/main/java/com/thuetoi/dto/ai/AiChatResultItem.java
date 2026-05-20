package com.thuetoi.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResultItem {
    private String type; // "project", "freelancer", "link"
    private String id;
    private String title;
    private String subtitle;
    private String route;
}
