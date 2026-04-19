package com.thuetoi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocketConfig: Cấu hình realtime messaging và notifications theo improvement plan
 * Sử dụng STOMP over WebSocket, tích hợp với frontend React
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;
    private final AllowedOriginProperties allowedOriginProperties;

    public WebSocketConfig(
        WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor,
        AllowedOriginProperties allowedOriginProperties
    ) {
        this.webSocketAuthChannelInterceptor = webSocketAuthChannelInterceptor;
        this.allowedOriginProperties = allowedOriginProperties;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple broker cho topic (broadcast) và queue (user specific)
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix cho messages từ client
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOriginProperties.asArray())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
