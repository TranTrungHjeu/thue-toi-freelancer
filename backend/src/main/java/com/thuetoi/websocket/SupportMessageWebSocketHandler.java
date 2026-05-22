package com.thuetoi.websocket;

import com.thuetoi.dto.response.marketplace.MessageRealtimeEvent;
import com.thuetoi.dto.response.marketplace.MessageResponse;
import com.thuetoi.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class SupportMessageWebSocketHandler extends TextWebSocketHandler {

    private static final String ATTR_USER_ID = "userId";
    private static final String ATTR_IS_ADMIN = "isAdmin";

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    // Key: userId, Value: Set of sessions for that user
    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    // Set of sessions for all admins
    private final Set<WebSocketSession> adminSessions = ConcurrentHashMap.newKeySet();

    public SupportMessageWebSocketHandler(
        JwtTokenProvider jwtTokenProvider,
        ObjectMapper objectMapper
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        Map<String, String> params = parseQuery(uri.getQuery());
        String token = params.get("token");

        if (token == null || !jwtTokenProvider.validateAccessToken(token)) {
            session.close(new CloseStatus(CloseStatus.POLICY_VIOLATION.getCode(), "Invalid token"));
            return;
        }

        Long userId = Long.parseLong(jwtTokenProvider.getSubjectFromAccessToken(token));
        String role = jwtTokenProvider.getRoleFromAccessToken(token);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);

        session.getAttributes().put(ATTR_USER_ID, userId);
        session.getAttributes().put(ATTR_IS_ADMIN, isAdmin);

        if (isAdmin) {
            adminSessions.add(session);
        } else {
            userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        }

        System.out.println("[SupportWebSocket] Connected: User " + userId + " (Admin: " + isAdmin + ")");
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        removeSession(session);
        session.close(CloseStatus.SERVER_ERROR);
    }

    public void broadcast(MessageResponse messageResponse) {
        if (messageResponse == null) return;

        // Support message event
        MessageRealtimeEvent event = new MessageRealtimeEvent("SUPPORT_MESSAGE_CREATED", null, messageResponse);
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (IOException ex) {
            return;
        }

        TextMessage textMessage = new TextMessage(payload);

        System.out.println("[SupportWebSocket] Broadcasting support message id=" + messageResponse.id() +
            " from senderRole=" + messageResponse.senderRole() +
            " to " + adminSessions.size() + " admins.");

        // 1. Always send to all admin sessions
        broadcastToSet(adminSessions, textMessage);

        // 2. Send to the specific user involved (if not admin)
        // If sender is admin, recipient is user. If sender is user, sender is user.
        Long targetUserId = messageResponse.senderId() != null
            ? ("ADMIN".equalsIgnoreCase(messageResponse.senderRole()) ? messageResponse.recipientId() : messageResponse.senderId())
            : messageResponse.recipientId();

        if (targetUserId != null) {
            Set<WebSocketSession> sessions = userSessions.get(targetUserId);
            int userSessionCount = sessions != null ? sessions.size() : 0;
            System.out.println("[SupportWebSocket] Target user is userId=" + targetUserId +
                " who has " + userSessionCount + " active session(s).");
            if (sessions != null) {
                broadcastToSet(sessions, textMessage);
            }
        }
    }

    private void broadcastToSet(Set<WebSocketSession> sessions, TextMessage message) {
        Set<WebSocketSession> staleSessions = sessions.stream()
            .filter(session -> !session.isOpen())
            .collect(Collectors.toSet());
        sessions.removeAll(staleSessions);

        for (WebSocketSession session : sessions) {
            try {
                session.sendMessage(message);
            } catch (IOException ex) {
                // Ignore and let cleanup handle it
            }
        }
    }

    private void removeSession(WebSocketSession session) {
        Boolean isAdmin = (Boolean) session.getAttributes().get(ATTR_IS_ADMIN);
        if (Boolean.TRUE.equals(isAdmin)) {
            adminSessions.remove(session);
        } else {
            Long userId = (Long) session.getAttributes().get(ATTR_USER_ID);
            if (userId != null) {
                Set<WebSocketSession> sessions = userSessions.get(userId);
                if (sessions != null) {
                    sessions.remove(session);
                    if (sessions.isEmpty()) {
                        userSessions.remove(userId);
                    }
                }
            }
        }
    }

    private Map<String, String> parseQuery(String query) {
        if (query == null) return Map.of();
        return java.util.Arrays.stream(query.split("&"))
            .map(part -> part.split("=", 2))
            .filter(parts -> parts.length == 2)
            .collect(Collectors.toMap(
                parts -> URLDecoder.decode(parts[0], StandardCharsets.UTF_8),
                parts -> URLDecoder.decode(parts[1], StandardCharsets.UTF_8),
                (first, second) -> second
            ));
    }
}
