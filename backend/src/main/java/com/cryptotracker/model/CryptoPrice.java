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
@Document(collection = "crypto_prices")
public class CryptoPrice {

    @Id
    private String id;

    private String symbol;       // e.g., "BTC", "ETH"
    private String name;         // e.g., "Bitcoin"
    private double price;        // USD price
    private double change24h;    // 24h % change
    private double volume24h;    // 24h volume in USD
    private double marketCap;    // Market cap in USD
    private Instant timestamp;   // When recorded

    public CryptoPrice(String symbol, String name, double price,
                       double change24h, double volume24h, double marketCap) {
        this.symbol = symbol;
        this.name = name;
        this.price = price;
        this.change24h = change24h;
        this.volume24h = volume24h;
        this.marketCap = marketCap;
        this.timestamp = Instant.now();
    }
}
