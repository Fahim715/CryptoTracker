package com.cryptotracker.websocket;

import com.cryptotracker.model.CryptoPrice;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * WebSocket handler for real-time price broadcasting.
 *
 * Clients connect to ws://localhost:8080/ws/prices
 * and receive every price tick as a JSON message.
 *
 * CopyOnWriteArraySet gives thread-safe session management
 * without blocking reads — important for high-throughput systems.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PriceWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket client connected: {} (total: {})", session.getId(), sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("WebSocket client disconnected: {} (total: {})", session.getId(), sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Clients can send {"type":"subscribe","symbol":"BTC"} — future enhancement
        log.debug("Received from {}: {}", session.getId(), message.getPayload());
    }

    /**
     * Broadcast a price update to all connected WebSocket clients.
     * Called by the Kafka consumer on every tick.
     */
    public void broadcast(CryptoPrice price) {
        if (sessions.isEmpty()) return;

        try {
            String json = objectMapper.writeValueAsString(price);
            TextMessage message = new TextMessage(json);

            sessions.removeIf(session -> {
                if (!session.isOpen()) return true;
                try {
                    synchronized (session) {
                        session.sendMessage(message);
                    }
                    return false;
                } catch (Exception e) {
                    log.warn("Failed to send to session {}: {}", session.getId(), e.getMessage());
                    return true; // remove dead session
                }
            });
        } catch (Exception e) {
            log.error("Error broadcasting price: {}", e.getMessage());
        }
    }

    public int getConnectedClients() {
        return sessions.size();
    }
}
