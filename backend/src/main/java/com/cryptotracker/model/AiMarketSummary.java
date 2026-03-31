package com.cryptotracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiMarketSummary {
    private String symbol;
    private String summary;
    private String model;
    private Instant generatedAt;
}
