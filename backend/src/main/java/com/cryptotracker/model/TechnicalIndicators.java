package com.cryptotracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TechnicalIndicators {
    private String symbol;
    private Double rsi;           // 0–100
    private Double macd;          // MACD line
    private Double macdSignal;    // Signal line
    private Double macdHistogram; // Histogram
    private Double sma20;         // 20-period SMA
    private Double ema12;         // 12-period EMA
    private Double ema26;         // 26-period EMA
    private Double bollingerUpper;
    private Double bollingerMiddle;
    private Double bollingerLower;
    private String trend;         // "BULLISH", "BEARISH", "NEUTRAL"
}
