package com.cryptotracker.service;

import com.cryptotracker.model.AiMarketSummary;
import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.model.TechnicalIndicators;
import com.cryptotracker.repository.CryptoPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiMarketAnalystService {

    private final CryptoPriceRepository priceRepository;
    private final TechnicalIndicatorService indicatorService;
    private final RestTemplate restTemplate;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String groqModel;

    public AiMarketSummary generateSummary(String symbol) {
        String upper = symbol.toUpperCase();

        if (groqApiKey == null || groqApiKey.isBlank()) {
            return new AiMarketSummary(
                    upper,
                    "Groq API key is not configured. Set GROQ_API_KEY to enable AI analysis.",
                    "unconfigured",
                    Instant.now()
            );
        }

        Optional<CryptoPrice> latestOpt = priceRepository.findTopBySymbolOrderByTimestampDesc(upper);
        if (latestOpt.isEmpty()) {
            return new AiMarketSummary(
                    upper,
                    "No live price data found yet for this symbol.",
                    groqModel,
                    Instant.now()
            );
        }

        CryptoPrice latest = latestOpt.get();
        TechnicalIndicators ti = indicatorService.calculate(upper);
        String userPrompt = buildUserPrompt(latest, ti);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> payload = Map.of(
                "model", groqModel,
            "temperature", 0.2,
            "max_tokens", 220,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                    "content", "You are a beginner-friendly crypto explainer. Use very simple English and short sentences. Avoid jargon. If you must mention RSI, MACD, or Bollinger Bands, explain each in plain words in 3-6 words. Keep the full response under 90 words. Do not give financial advice. Return exactly 3 numbered lines in this format: 1) Market mood: ... 2) Risk level: ... 3) What to watch next: ..."
                        ),
                        Map.of(
                                "role", "user",
                                "content", userPrompt
                        )
                )
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );
            String content = extractContent(response.getBody());

            if (content == null || content.isBlank()) {
                content = "AI summary is unavailable right now. Please try again in a moment.";
            }

            return new AiMarketSummary(upper, content.trim(), groqModel, Instant.now());
        } catch (Exception ex) {
            log.warn("Failed to generate AI market summary for {}: {}", upper, ex.getMessage());
            return new AiMarketSummary(
                    upper,
                    "Unable to generate AI summary right now. Please try again later.",
                    groqModel,
                    Instant.now()
            );
        }
    }

    private String buildUserPrompt(CryptoPrice p, TechnicalIndicators ti) {
        return String.format(
                "Analyze %s market conditions using this snapshot:\n" +
                        "Price: %.2f USD\n" +
                        "24h Change: %.2f%%\n" +
                        "24h Volume: %.2f USD\n" +
                        "Market Cap: %.2f USD\n" +
                        "RSI: %s\n" +
                        "MACD: %s\n" +
                        "MACD Signal: %s\n" +
                        "Bollinger Upper: %s\n" +
                        "Bollinger Middle: %s\n" +
                        "Bollinger Lower: %s\n" +
                        "Trend: %s\n\n" +
                            "Write for a beginner. Use common words.\n" +
                            "Avoid complex trading language.\n" +
                            "Return exactly:\n" +
                            "1) Market mood: ...\n" +
                            "2) Risk level: ...\n" +
                            "3) What to watch next: ...",
                p.getSymbol(),
                p.getPrice(),
                p.getChange24h(),
                p.getVolume24h(),
                p.getMarketCap(),
                fmt(ti.getRsi()),
                fmt(ti.getMacd()),
                fmt(ti.getMacdSignal()),
                fmt(ti.getBollingerUpper()),
                fmt(ti.getBollingerMiddle()),
                fmt(ti.getBollingerLower()),
                ti.getTrend() == null ? "NEUTRAL" : ti.getTrend()
        );
    }

    private String fmt(Double value) {
        return value == null ? "n/a" : String.format("%.4f", value);
    }

    private String extractContent(Map<String, Object> responseBody) {
        if (responseBody == null) return null;

        Object choicesObj = responseBody.get("choices");
        if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) return null;

        Object firstObj = choices.get(0);
        if (!(firstObj instanceof Map<?, ?> first)) return null;

        Object messageObj = first.get("message");
        if (!(messageObj instanceof Map<?, ?> message)) return null;

        Object contentObj = message.get("content");
        return contentObj == null ? null : contentObj.toString();
    }
}
