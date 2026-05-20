package com.thuetoi.config;

import com.thuetoi.websocket.ContractMessageWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocket
public class MessageWebSocketConfig implements WebSocketConfigurer {

    private final ContractMessageWebSocketHandler contractMessageWebSocketHandler;

    public MessageWebSocketConfig(ContractMessageWebSocketHandler contractMessageWebSocketHandler) {
        this.contractMessageWebSocketHandler = contractMessageWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Đăng ký cả hai endpoint để tương thích tối đa với các loại Proxy
        registry.addHandler(contractMessageWebSocketHandler, "/ws/messages", "/api/ws/messages")
            .addInterceptors(new TokenHandshakeInterceptor())
            .setAllowedOriginPatterns("*");
    }

    /**
     * Interceptor để trích xuất token từ query param và đưa vào WebSocket attributes
     * trước khi thiết lập kết nối (handshake).
     */
    private static class TokenHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                     WebSocketHandler wsHandler, Map<String, Object> attributes) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                String token = servletRequest.getServletRequest().getParameter("token");
                String contractId = servletRequest.getServletRequest().getParameter("contractId");

                if (token != null) attributes.put("token", token);
                if (contractId != null) attributes.put("contractId", contractId);
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Exception exception) {
        }
    }
}
