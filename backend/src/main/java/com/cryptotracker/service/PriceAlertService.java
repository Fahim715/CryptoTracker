package com.cryptotracker.service;

import com.cryptotracker.model.PriceAlert;
import com.cryptotracker.repository.PriceAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Sinks;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceAlertService {

    private final PriceAlertRepository alertRepository;
    private final AiAlertExplainerService aiAlertExplainerService;
    private final Sinks.Many<Map<String, Object>> alertSink; // SSE sink for alert events

    public PriceAlert createAlert(String symbol, String condition, double targetPrice) {
        PriceAlert alert = new PriceAlert(symbol, condition, targetPrice);
        PriceAlert saved = alertRepository.save(alert);
        log.info("Alert created: {} {} ${}", symbol, condition, targetPrice);
        return saved;
    }

    public void deleteAlert(String id) {
        alertRepository.deleteById(id);
    }

    public List<PriceAlert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Called on every price tick. Checks all active alerts
     * and fires them if conditions are met.
     */
    public void checkAlerts(String symbol, double currentPrice) {
        List<PriceAlert> activeAlerts = alertRepository.findByTriggeredFalse();

        for (PriceAlert alert : activeAlerts) {
            if (!alert.getSymbol().equals(symbol)) continue;

            boolean shouldTrigger = switch (alert.getCondition()) {
                case "ABOVE" -> currentPrice >= alert.getTargetPrice();
                case "BELOW" -> currentPrice <= alert.getTargetPrice();
                default      -> false;
            };

            if (shouldTrigger) {
                alert.setTriggered(true);
                alert.setTriggeredAt(Instant.now());
                alertRepository.save(alert);

                String explanation = aiAlertExplainerService.explainTriggeredAlert(
                    symbol,
                    alert.getCondition(),
                    alert.getTargetPrice(),
                    currentPrice
                );

                // Push alert event via SSE
                Map<String, Object> event = Map.of(
                        "type",         "ALERT_TRIGGERED",
                        "symbol",       symbol,
                        "condition",    alert.getCondition(),
                        "targetPrice",  alert.getTargetPrice(),
                        "currentPrice", currentPrice,
                        "triggeredAt",  alert.getTriggeredAt().toString(),
                        "explanation",  explanation
                );
                alertSink.tryEmitNext(event);

                log.info("🔔 ALERT TRIGGERED: {} {} ${} (current: ${})",
                        symbol, alert.getCondition(), alert.getTargetPrice(), currentPrice);
            }
        }
    }
}
