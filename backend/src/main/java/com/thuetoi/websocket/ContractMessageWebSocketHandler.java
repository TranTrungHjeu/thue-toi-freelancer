package com.thuetoi.websocket;

import com.thuetoi.dto.response.marketplace.MessageRealtimeEvent;
import com.thuetoi.dto.response.marketplace.MessageResponse;
import com.thuetoi.security.JwtTokenProvider;
import com.thuetoi.service.ContractAccessService;
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
public class ContractMessageWebSocketHandler extends TextWebSocketHandler {

    private static final String ATTR_CONTRACT_ID = "contractId";

    private final JwtTokenProvider jwtTokenProvider;
    private final ContractAccessService contractAccessService;
    private final ObjectMapper objectMapper;
    private final Map<Long, Set<WebSocketSession>> contractSessions = new ConcurrentHashMap<>();

    public ContractMessageWebSocketHandler(
        JwtTokenProvider jwtTokenProvider,
        ContractAccessService contractAccessService,
        ObjectMapper objectMapper
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.contractAccessService = contractAccessService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        ConnectionContext context;
        try {
            context = parseConnectionContext(session.getUri());
        } catch (Exception ex) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        if (!jwtTokenProvider.validateAccessToken(context.token())) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long currentUserId;
        try {
            currentUserId = Long.parseLong(jwtTokenProvider.getSubjectFromAccessToken(context.token()));
        } catch (NumberFormatException ex) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        try {
            contractAccessService.requireAccessibleContract(context.contractId(), currentUserId);
        } catch (Exception ex) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        session.getAttributes().put(ATTR_CONTRACT_ID, context.contractId());
        contractSessions.computeIfAbsent(context.contractId(), ignored -> ConcurrentHashMap.newKeySet()).add(session);
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
        if (messageResponse == null || messageResponse.contractId() == null) {
            return;
        }

        Set<WebSocketSession> sessions = contractSessions.get(messageResponse.contractId());
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        MessageRealtimeEvent event = new MessageRealtimeEvent("MESSAGE_CREATED", messageResponse.contractId(), messageResponse);
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (IOException ex) {
            return;
        }

        Set<WebSocketSession> staleSessions = sessions.stream()
            .filter(session -> !session.isOpen())
            .collect(Collectors.toSet());
        sessions.removeAll(staleSessions);

        for (WebSocketSession session : sessions) {
            try {
                session.sendMessage(new TextMessage(payload));
            } catch (IOException ex) {
                removeSession(session);
            }
        }
    }

    private void removeSession(WebSocketSession session) {
        Object contractIdValue = session.getAttributes().get(ATTR_CONTRACT_ID);
        if (!(contractIdValue instanceof Long contractId)) {
            return;
        }
        Set<WebSocketSession> sessions = contractSessions.get(contractId);
        if (sessions == null) {
            return;
        }
        sessions.remove(session);
        if (sessions.isEmpty()) {
            contractSessions.remove(contractId);
        }
    }

    private ConnectionContext parseConnectionContext(URI uri) {
        if (uri == null || uri.getQuery() == null) {
            throw new IllegalArgumentException("Missing query string");
        }

        Map<String, String> params = parseQuery(uri.getQuery());
        String token = params.get("token");
        String contractIdRaw = params.get("contractId");

        if (token == null || token.isBlank() || contractIdRaw == null || contractIdRaw.isBlank()) {
            throw new IllegalArgumentException("Missing token or contractId");
        }

        return new ConnectionContext(token, Long.parseLong(contractIdRaw));
    }

    private Map<String, String> parseQuery(String query) {
        return java.util.Arrays.stream(query.split("&"))
            .map(part -> part.split("=", 2))
            .filter(parts -> parts.length == 2)
            .collect(Collectors.toMap(
                parts -> URLDecoder.decode(parts[0], StandardCharsets.UTF_8),
                parts -> URLDecoder.decode(parts[1], StandardCharsets.UTF_8),
                (first, second) -> second
            ));
    }

    private record ConnectionContext(String token, Long contractId) {
    }
}
