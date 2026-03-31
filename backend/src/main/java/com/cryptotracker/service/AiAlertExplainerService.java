package com.cryptotracker.service;

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

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAlertExplainerService {

    private final RestTemplate restTemplate;
    private final TechnicalIndicatorService indicatorService;
    private final CryptoPriceRepository priceRepository;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String groqModel;

    public String explainTriggeredAlert(String symbol, String condition, double targetPrice, double currentPrice) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "AI explain is off (missing GROQ_API_KEY).";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            String upper = symbol.toUpperCase();
            String userPrompt = String.format(
                    "Alert triggered for %s. Condition: %s %.2f, Current price: %.2f. Explain in very simple words why this may have happened and what RSI/MACD/Bollinger suggest. Keep under 70 words.",
                    upper, condition, targetPrice, currentPrice
            );

            List<Map<String, Object>> messages = List.of(
                    Map.of(
                            "role", "system",
                            "content", "You are a beginner-friendly crypto explainer. Use only simple language. Return exactly 2 bullets: - Why it moved: ... - What indicators suggest: ..."
                    ),
                    Map.of("role", "user", "content", userPrompt)
            );

            Map<String, Object> toolSchema = Map.of(
                    "type", "function",
                    "function", Map.of(
                            "name", "get_indicator_snapshot",
                            "description", "Get latest market and indicator snapshot for a symbol",
                            "parameters", Map.of(
                                    "type", "object",
                                    "properties", Map.of(
                                            "symbol", Map.of("type", "string", "description", "Crypto symbol like BTC or ETH")
                                    ),
                                    "required", List.of("symbol")
                            )
                    )
            );

            Map<String, Object> firstPayload = Map.of(
                    "model", groqModel,
                    "temperature", 0.2,
                    "max_tokens", 220,
                    "messages", messages,
                    "tools", List.of(toolSchema),
                    "tool_choice", "auto"
            );

            ResponseEntity<Map<String, Object>> firstResp = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(firstPayload, headers),
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> firstMessage = extractMessage(firstResp.getBody());
            if (firstMessage == null) return fallback(symbol, condition, targetPrice, currentPrice);

            Object toolCallsObj = firstMessage.get("tool_calls");
            if (!(toolCallsObj instanceof List<?> toolCalls) || toolCalls.isEmpty()) {
                String direct = toText(firstMessage.get("content"));
                return (direct == null || direct.isBlank())
                        ? fallback(symbol, condition, targetPrice, currentPrice)
                        : direct.trim();
            }

            Object firstCallObj = toolCalls.get(0);
            if (!(firstCallObj instanceof Map<?, ?> firstCall)) {
                return fallback(symbol, condition, targetPrice, currentPrice);
            }

            String toolCallId = toText(firstCall.get("id"));
            Object funcObj = firstCall.get("function");
            if (!(funcObj instanceof Map<?, ?> fnMap)) {
                return fallback(symbol, condition, targetPrice, currentPrice);
            }

            String fnName = toText(fnMap.get("name"));
            if (!"get_indicator_snapshot".equals(fnName)) {
                return fallback(symbol, condition, targetPrice, currentPrice);
            }

            String toolResult = getIndicatorSnapshotJson(upper);

            List<Map<String, Object>> secondMessages = List.of(
                    Map.of(
                            "role", "system",
                            "content", "You are a beginner-friendly crypto explainer. Use only simple language. Return exactly 2 bullets: - Why it moved: ... - What indicators suggest: ..."
                    ),
                    Map.of("role", "user", "content", userPrompt),
                    Map.of("role", "assistant", "content", "", "tool_calls", toolCalls),
                    Map.of(
                            "role", "tool",
                            "tool_call_id", toolCallId == null ? "tool_call_1" : toolCallId,
                            "name", "get_indicator_snapshot",
                            "content", toolResult
                    )
            );

            Map<String, Object> secondPayload = Map.of(
                    "model", groqModel,
                    "temperature", 0.2,
                    "max_tokens", 180,
                    "messages", secondMessages
            );

            ResponseEntity<Map<String, Object>> secondResp = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(secondPayload, headers),
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> finalMessage = extractMessage(secondResp.getBody());
            String finalText = finalMessage == null ? null : toText(finalMessage.get("content"));
            return (finalText == null || finalText.isBlank())
                    ? fallback(symbol, condition, targetPrice, currentPrice)
                    : finalText.trim();
        } catch (Exception ex) {
            log.warn("AI alert explainer failed for {}: {}", symbol, ex.getMessage());
            return fallback(symbol, condition, targetPrice, currentPrice);
        }
    }

    private String getIndicatorSnapshotJson(String symbol) {
        TechnicalIndicators ti = indicatorService.calculate(symbol);
        Optional<CryptoPrice> latest = priceRepository.findTopBySymbolOrderByTimestampDesc(symbol);

        Map<String, Object> snapshot = Map.of(
                "symbol", symbol,
                "price", latest.map(CryptoPrice::getPrice).orElse(null),
                "change24h", latest.map(CryptoPrice::getChange24h).orElse(null),
                "rsi", ti.getRsi(),
                "macd", ti.getMacd(),
                "macdSignal", ti.getMacdSignal(),
                "bollingerUpper", ti.getBollingerUpper(),
                "bollingerMiddle", ti.getBollingerMiddle(),
                "bollingerLower", ti.getBollingerLower(),
                "trend", ti.getTrend()
        );

        return snapshot.toString();
    }

    private Map<String, Object> extractMessage(Map<String, Object> responseBody) {
        if (responseBody == null) return null;
        Object choicesObj = responseBody.get("choices");
        if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) return null;
        Object firstObj = choices.get(0);
        if (!(firstObj instanceof Map<?, ?> first)) return null;
        Object messageObj = first.get("message");
        if (!(messageObj instanceof Map<?, ?> message)) return null;
                Map<String, Object> converted = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : message.entrySet()) {
                        if (entry.getKey() != null) {
                                converted.put(entry.getKey().toString(), entry.getValue());
                        }
                }
                return converted;
    }

    private String toText(Object value) {
        return value == null ? null : value.toString();
    }

    private String fallback(String symbol, String condition, double targetPrice, double currentPrice) {
        return String.format(
                "- Why it moved: %s crossed your %s %.2f alert (now %.2f).\n- What indicators suggest: Momentum may be changing; check RSI and MACD for confirmation.",
                symbol,
                condition,
                targetPrice,
                currentPrice
        );
    }
}
