package com.cryptotracker.consumer;

import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.repository.CryptoPriceRepository;
import com.cryptotracker.service.CandleAggregationService;
import com.cryptotracker.service.PriceAlertService;
import com.cryptotracker.websocket.PriceWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

@Slf4j
@Component
@RequiredArgsConstructor
public class CryptoPriceConsumer {

    private final CryptoPriceRepository    repository;
    private final Sinks.Many<CryptoPrice>  priceSink;
    private final CandleAggregationService candleService;
    private final PriceAlertService        alertService;
    private final PriceWebSocketHandler    webSocketHandler;

    @KafkaListener(
            topics = "#{T(com.cryptotracker.config.KafkaConfig).CRYPTO_PRICES_TOPIC}",
            groupId = "crypto-tracker-group"
    )
    public void consume(CryptoPrice price) {
        log.info("Consumed: {} = ${}", price.getSymbol(), price.getPrice());

        // 1. Persist raw tick to MongoDB
        repository.save(price);

        // 2. Aggregate into OHLCV candles (1m, 5m, 1h)
        candleService.processTick(price);

        // 3. Check price alerts
        alertService.checkAlerts(price.getSymbol(), price.getPrice());

        // 4. Push to SSE sink (browser EventSource)
        priceSink.tryEmitNext(price);

        // 5. Broadcast via WebSocket
        webSocketHandler.broadcast(price);
    }
}
