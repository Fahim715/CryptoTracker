package com.cryptotracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "candles")
@CompoundIndex(def = "{'symbol': 1, 'interval': 1, 'openTime': 1}", unique = true)
public class Candle {

    @Id
    private String id;

    private String symbol;      // BTC, ETH ...
    private String interval;    // "1m", "5m", "1h"
    private double open;
    private double high;
    private double low;
    private double close;
    private double volume;
    private Instant openTime;
    private Instant closeTime;
    private int tickCount;      // how many ticks aggregated
}
