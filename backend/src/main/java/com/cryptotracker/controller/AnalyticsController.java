package com.cryptotracker.controller;

import com.cryptotracker.model.PriceAlert;
import com.cryptotracker.model.TechnicalIndicators;
import com.cryptotracker.ratelimit.RateLimiter;
import com.cryptotracker.service.PriceAlertService;
import com.cryptotracker.service.TechnicalIndicatorService;
import com.cryptotracker.websocket.PriceWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AnalyticsController {

    private final TechnicalIndicatorService  indicatorService;
    private final PriceAlertService          alertService;
    private final RateLimiter                rateLimiter;
    private final PriceWebSocketHandler      webSocketHandler;
    private final Sinks.Many<Map<String, Object>> alertSink;

    // ── Technical Indicators ─────────────────────────────────────────────────

    /**
     * GET /api/indicators/{symbol}
     * Returns RSI, MACD, Bollinger Bands, SMA, EMA and trend signal.
     */
    @GetMapping("/indicators/{symbol}")
    public ResponseEntity<TechnicalIndicators> getIndicators(@PathVariable String symbol) {
        TechnicalIndicators ti = indicatorService.calculate(symbol.toUpperCase());
        return ResponseEntity.ok(ti);
    }

    // ── Price Alerts ─────────────────────────────────────────────────────────

    /**
     * GET /api/alerts
     * List all alerts.
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<PriceAlert>> getAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    /**
     * POST /api/alerts
     * Create a new price alert.
     * Body: { "symbol": "BTC", "condition": "ABOVE", "targetPrice": 70000 }
     */
    @PostMapping("/alerts")
    public ResponseEntity<PriceAlert> createAlert(@RequestBody Map<String, Object> body) {
        String symbol      = (String) body.get("symbol");
        String condition   = (String) body.get("condition");
        double targetPrice = ((Number) body.get("targetPrice")).doubleValue();
        PriceAlert alert   = alertService.createAlert(symbol, condition, targetPrice);
        return ResponseEntity.ok(alert);
    }

    /**
     * DELETE /api/alerts/{id}
     */
    @DeleteMapping("/alerts/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable String id) {
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/alerts/stream
     * SSE stream of triggered alert events.
     */
    @GetMapping(value = "/alerts/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Map<String, Object>>> alertStream() {
        return alertSink.asFlux()
                .map(event -> ServerSentEvent.<Map<String, Object>>builder()
                        .event("alert-triggered")
                        .data(event)
                        .build());
    }

    // ── System Stats ─────────────────────────────────────────────────────────

    /**
     * GET /api/system/stats
     * Returns rate limiter status and WebSocket connection count.
     */
    @GetMapping("/system/stats")
    public ResponseEntity<Map<String, Object>> systemStats() {
        return ResponseEntity.ok(Map.of(
                "rateLimiterTokens",   rateLimiter.getAvailableTokens(),
                "wsConnectedClients",  webSocketHandler.getConnectedClients()
        ));
    }
}
