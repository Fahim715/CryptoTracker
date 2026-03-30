package com.cryptotracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "price_alerts")
public class PriceAlert {

    @Id
    private String id;

    private String symbol;          // e.g. "BTC"
    private String condition;       // "ABOVE" or "BELOW"
    private double targetPrice;
    private boolean triggered;
    private Instant createdAt;
    private Instant triggeredAt;

    public PriceAlert(String symbol, String condition, double targetPrice) {
        this.symbol      = symbol.toUpperCase();
        this.condition   = condition.toUpperCase();
        this.targetPrice = targetPrice;
        this.triggered   = false;
        this.createdAt   = Instant.now();
    }
}
