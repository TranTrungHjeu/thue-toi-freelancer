package com.thuetoi.config;

import com.thuetoi.security.JwtTokenProvider;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    public WebSocketAuthChannelInterceptor(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authorizationHeader = firstHeaderValue(accessor, "Authorization");
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            authorizationHeader = firstHeaderValue(accessor, "authorization");
        }

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String accessToken = authorizationHeader.substring(7).trim();
        if (!jwtTokenProvider.validateAccessToken(accessToken)) {
            return null;
        }

        String userId = jwtTokenProvider.getSubjectFromAccessToken(accessToken);
        accessor.setUser(new WebSocketPrincipal(userId));
        return message;
    }

    private String firstHeaderValue(StompHeaderAccessor accessor, String headerName) {
        return accessor.getNativeHeader(headerName) == null || accessor.getNativeHeader(headerName).isEmpty()
            ? null
            : accessor.getNativeHeader(headerName).get(0);
    }
}
