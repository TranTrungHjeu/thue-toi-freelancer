package com.thuetoi.config;

import com.thuetoi.websocket.ContractMessageWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class MessageWebSocketConfig implements WebSocketConfigurer {

    private final ContractMessageWebSocketHandler contractMessageWebSocketHandler;

    public MessageWebSocketConfig(ContractMessageWebSocketHandler contractMessageWebSocketHandler) {
        this.contractMessageWebSocketHandler = contractMessageWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(contractMessageWebSocketHandler, "/realtime/messages")
            .setAllowedOriginPatterns("http://localhost:*");
    }
}
