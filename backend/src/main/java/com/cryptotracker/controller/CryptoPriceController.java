package com.cryptotracker.controller;

import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.repository.CryptoPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CryptoPriceController {

    private final CryptoPriceRepository repository;
    private final Sinks.Many<CryptoPrice> priceSink;

    /**
     * SSE endpoint – frontend subscribes here for real-time updates.
     * GET /api/prices/stream
     */
    @GetMapping(value = "/prices/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<CryptoPrice>> stream() {
        return priceSink.asFlux()
                .map(price -> ServerSentEvent.<CryptoPrice>builder()
                        .id(price.getSymbol() + "-" + price.getTimestamp().toEpochMilli())
                        .event("price-update")
                        .data(price)
                        .build());
    }

    /**
     * Latest price for each tracked coin.
     * GET /api/prices/latest
     */
    @GetMapping("/prices/latest")
    public ResponseEntity<List<CryptoPrice>> latestPrices() {
        List<String> symbols = List.of("BTC", "ETH", "BNB", "SOL", "ADA");
        List<CryptoPrice> latest = new ArrayList<>();
        for (String symbol : symbols) {
            repository.findTopBySymbolOrderByTimestampDesc(symbol).ifPresent(latest::add);
        }
        return ResponseEntity.ok(latest);
    }

    /**
     * 24-hour price history for a symbol.
     * GET /api/prices/history/{symbol}?hours=24
     */
    @GetMapping("/prices/history/{symbol}")
    public ResponseEntity<List<CryptoPrice>> history(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "24") int hours) {

        Instant from = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant to   = Instant.now();
        List<CryptoPrice> history = repository
                .findBySymbolAndTimestampBetweenOrderByTimestampAsc(symbol.toUpperCase(), from, to);
        return ResponseEntity.ok(history);
    }

    /**
     * Health check.
     * GET /api/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "crypto-tracker"));
    }
}
