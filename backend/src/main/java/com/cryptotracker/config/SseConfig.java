package com.cryptotracker.config;

import com.cryptotracker.model.CryptoPrice;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Sinks;

@Configuration
public class SseConfig {

    /**
     * Shared multicast sink – all SSE subscribers receive every price update.
     * LATEST keeps a buffer of 50 events for late subscribers.
     */
    @Bean
    public Sinks.Many<CryptoPrice> priceSink() {
        return Sinks.many().multicast().onBackpressureBuffer(50);
    }
}
