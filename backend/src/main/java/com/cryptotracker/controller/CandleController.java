package com.cryptotracker.controller;

import com.cryptotracker.model.Candle;
import com.cryptotracker.service.CandleAggregationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CandleController {

    private final CandleAggregationService candleService;

    /**
     * GET /api/candles/{symbol}?interval=1m&limit=100
     * Returns OHLCV candlestick data for charting.
        * Intervals: 1m, 5m, 1h
     */
    @GetMapping("/candles/{symbol}")
    public ResponseEntity<List<Candle>> getCandles(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1h") String interval,
            @RequestParam(defaultValue = "100") int limit) {

        List<Candle> candles = candleService.getCandles(symbol.toUpperCase(), interval, limit);
        return ResponseEntity.ok(candles);
    }
}
