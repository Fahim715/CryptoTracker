package com.cryptotracker.producer;

import com.cryptotracker.config.KafkaConfig;
import com.cryptotracker.model.CryptoPrice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CryptoPriceProducer {

    private final KafkaTemplate<String, CryptoPrice> kafkaTemplate;

    /**
     * Publish a price update to Kafka.
     * Key = symbol so that all updates for BTC go to the same partition.
     */
    public void publish(CryptoPrice price) {
        kafkaTemplate.send(KafkaConfig.CRYPTO_PRICES_TOPIC, price.getSymbol(), price)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish price for {}: {}", price.getSymbol(), ex.getMessage());
                    } else {
                        log.debug("Published {} @ ${} → partition {}",
                                price.getSymbol(), price.getPrice(),
                                result.getRecordMetadata().partition());
                    }
                });
    }
}
