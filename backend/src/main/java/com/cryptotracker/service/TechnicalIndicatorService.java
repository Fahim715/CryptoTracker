package com.cryptotracker.service;

import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.model.TechnicalIndicators;
import com.cryptotracker.repository.CryptoPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TechnicalIndicatorService {

    private final CryptoPriceRepository repository;

    public TechnicalIndicators calculate(String symbol) {
        // Fetch last 48 hours of price history for indicator calculation
        Instant from = Instant.now().minus(48, ChronoUnit.HOURS);
        List<CryptoPrice> prices = repository
                .findBySymbolAndTimestampBetweenOrderByTimestampAsc(symbol.toUpperCase(), from, Instant.now());

        if (prices.size() < 14) {
            log.warn("Not enough data for indicators on {}: {} points", symbol, prices.size());
            TechnicalIndicators ti = new TechnicalIndicators();
            ti.setSymbol(symbol);
            ti.setTrend("NEUTRAL");
            return ti;
        }

        List<Double> closes = prices.stream().map(CryptoPrice::getPrice).toList();

        double rsi              = calculateRSI(closes, 14);
        double ema12            = calculateEMA(closes, 12);
        double ema26            = calculateEMA(closes, 26);
        double macd             = ema12 - ema26;
        double sma20            = calculateSMA(closes, 20);
        double stdDev           = calculateStdDev(closes, 20);
        double bollingerUpper   = sma20 + (2 * stdDev);
        double bollingerLower   = sma20 - (2 * stdDev);

        // Simple signal line: 9-period EMA of MACD — approximate with last 9 MACD values
        double macdSignal = calculateMACDSignal(closes, 9);
        double macdHistogram = macd - macdSignal;

        String trend = determineTrend(rsi, macd, macdSignal, closes);

        return new TechnicalIndicators(
                symbol, rsi, macd, macdSignal, macdHistogram,
                sma20, ema12, ema26,
                bollingerUpper, sma20, bollingerLower,
                trend
        );
    }

    // ── RSI ───────────────────────────────────────────────────────────────────

    private double calculateRSI(List<Double> prices, int period) {
        if (prices.size() < period + 1) return 50.0;

        List<Double> gains = new ArrayList<>();
        List<Double> losses = new ArrayList<>();

        for (int i = 1; i <= period; i++) {
            double change = prices.get(i) - prices.get(i - 1);
            gains.add(Math.max(change, 0));
            losses.add(Math.max(-change, 0));
        }

        double avgGain = gains.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double avgLoss = losses.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        // Wilder's smoothing for remaining periods
        for (int i = period + 1; i < prices.size(); i++) {
            double change = prices.get(i) - prices.get(i - 1);
            avgGain = ((avgGain * (period - 1)) + Math.max(change, 0)) / period;
            avgLoss = ((avgLoss * (period - 1)) + Math.max(-change, 0)) / period;
        }

        if (avgLoss == 0) return 100.0;
        double rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // ── EMA ───────────────────────────────────────────────────────────────────

    private double calculateEMA(List<Double> prices, int period) {
        if (prices.size() < period) return prices.get(prices.size() - 1);

        double multiplier = 2.0 / (period + 1);
        // Seed EMA with SMA of first `period` values
        double ema = prices.subList(0, period).stream()
                .mapToDouble(Double::doubleValue).average().orElse(0);

        for (int i = period; i < prices.size(); i++) {
            ema = (prices.get(i) - ema) * multiplier + ema;
        }
        return ema;
    }

    // ── SMA ───────────────────────────────────────────────────────────────────

    private double calculateSMA(List<Double> prices, int period) {
        int size = prices.size();
        if (size < period) period = size;
        return prices.subList(size - period, size).stream()
                .mapToDouble(Double::doubleValue).average().orElse(0);
    }

    // ── Standard Deviation ────────────────────────────────────────────────────

    private double calculateStdDev(List<Double> prices, int period) {
        int size = prices.size();
        if (size < period) period = size;
        List<Double> window = prices.subList(size - period, size);
        double mean = window.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = window.stream()
                .mapToDouble(p -> Math.pow(p - mean, 2))
                .average().orElse(0);
        return Math.sqrt(variance);
    }

    // ── MACD Signal (9-period EMA of MACD) ────────────────────────────────────

    private double calculateMACDSignal(List<Double> prices, int signalPeriod) {
        if (prices.size() < 26 + signalPeriod) return 0;
        // Build MACD series from rolling windows
        List<Double> macdSeries = new ArrayList<>();
        for (int i = 26; i <= prices.size(); i++) {
            List<Double> window = prices.subList(0, i);
            double e12 = calculateEMA(window, 12);
            double e26 = calculateEMA(window, 26);
            macdSeries.add(e12 - e26);
        }
        return calculateEMA(macdSeries, signalPeriod);
    }

    // ── Trend determination ───────────────────────────────────────────────────

    private String determineTrend(double rsi, double macd, double macdSignal, List<Double> closes) {
        int bullSignals = 0;
        int bearSignals = 0;

        if (rsi > 55) bullSignals++; else if (rsi < 45) bearSignals++;
        if (macd > macdSignal) bullSignals++; else if (macd < macdSignal) bearSignals++;

        // Price above SMA20?
        double sma20 = calculateSMA(closes, 20);
        double lastPrice = closes.get(closes.size() - 1);
        if (lastPrice > sma20) bullSignals++; else bearSignals++;

        if (bullSignals >= 2) return "BULLISH";
        if (bearSignals >= 2) return "BEARISH";
        return "NEUTRAL";
    }
}
