package com.cryptotracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Sinks;

import java.util.Map;

@Configuration
public class AlertSseConfig {

    @Bean
    public Sinks.Many<Map<String, Object>> alertSink() {
        return Sinks.many().multicast().onBackpressureBuffer(20);
    }
}
