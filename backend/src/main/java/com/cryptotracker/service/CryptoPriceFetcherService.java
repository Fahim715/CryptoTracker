package com.cryptotracker.service;

import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.producer.CryptoPriceProducer;
import com.cryptotracker.ratelimit.RateLimiter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CryptoPriceFetcherService {

    private static final String COINGECKO_URL =
            "https://api.coingecko.com/api/v3/coins/markets" +
            "?vs_currency=usd" +
            "&ids=bitcoin,ethereum,binancecoin,solana,cardano" +
            "&order=market_cap_desc" +
            "&per_page=5&page=1" +
            "&sparkline=false&price_change_percentage=24h";

    private static final Map<String, String> SYMBOL_MAP = Map.of(
            "bitcoin",     "BTC",
            "ethereum",    "ETH",
            "binancecoin", "BNB",
            "solana",      "SOL",
            "cardano",     "ADA"
    );

    private final CryptoPriceProducer producer;
    private final RestTemplate        restTemplate;
    private final ObjectMapper        objectMapper;
    private final RateLimiter         rateLimiter;

    @Scheduled(fixedDelay = 15_000)
    public void fetchAndPublish() {
        // Token bucket rate limiter — skip if no tokens available
        if (!rateLimiter.tryAcquire()) {
            log.warn("Rate limiter: skipping fetch cycle. Available tokens: {}",
                    rateLimiter.getAvailableTokens());
            return;
        }

        try {
            String json = restTemplate.getForObject(COINGECKO_URL, String.class);
            JsonNode coins = objectMapper.readTree(json);

            for (JsonNode coin : coins) {
                String id     = coin.get("id").asText();
                String symbol = SYMBOL_MAP.getOrDefault(id, id.toUpperCase());
                String name   = coin.get("name").asText();
                double price  = coin.get("current_price").asDouble();
                double change = coin.has("price_change_percentage_24h") && !coin.get("price_change_percentage_24h").isNull()
                                ? coin.get("price_change_percentage_24h").asDouble() : 0.0;
                double volume = coin.has("total_volume") ? coin.get("total_volume").asDouble() : 0.0;
                double mcap   = coin.has("market_cap")  ? coin.get("market_cap").asDouble()   : 0.0;

                CryptoPrice cp = new CryptoPrice(symbol, name, price, change, volume, mcap);
                producer.publish(cp);
            }

            log.info("Fetched & published {} prices (tokens remaining: {})",
                    coins.size(), rateLimiter.getAvailableTokens());

        } catch (Exception e) {
            log.error("Error fetching prices: {}", e.getMessage());
        }
    }
}
