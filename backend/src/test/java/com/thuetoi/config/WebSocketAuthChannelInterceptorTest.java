package com.thuetoi.config;

import com.thuetoi.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthChannelInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private MessageChannel messageChannel;

    @Test
    void connectWithoutBearerTokenIsRejected() {
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(jwtTokenProvider);

        Message<?> result = interceptor.preSend(connectMessage(null), messageChannel);

        assertThat(result).isNull();
    }

    @Test
    void connectWithInvalidBearerTokenIsRejected() {
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(jwtTokenProvider);
        when(jwtTokenProvider.validateAccessToken("bad-token")).thenReturn(false);

        Message<?> result = interceptor.preSend(connectMessage("Bearer bad-token"), messageChannel);

        assertThat(result).isNull();
    }

    @Test
    void connectWithValidBearerTokenSetsPrincipal() {
        WebSocketAuthChannelInterceptor interceptor = new WebSocketAuthChannelInterceptor(jwtTokenProvider);
        when(jwtTokenProvider.validateAccessToken("fresh-token")).thenReturn(true);
        when(jwtTokenProvider.getSubjectFromAccessToken("fresh-token")).thenReturn("42");

        Message<?> result = interceptor.preSend(connectMessage("Bearer fresh-token"), messageChannel);

        assertThat(result).isNotNull();
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertThat(accessor).isNotNull();
        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo("42");
    }

    private Message<byte[]> connectMessage(String authorizationHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        if (authorizationHeader != null) {
            accessor.setNativeHeader("Authorization", authorizationHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
