package com.cryptotracker.service;

import com.cryptotracker.model.Candle;
import com.cryptotracker.model.CryptoPrice;
import com.cryptotracker.repository.CandleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandleAggregationService {

    private final CandleRepository candleRepository;

    /**
     * Called every time a new price tick arrives.
     * Updates or creates candles for 1m, 5m, and 1h intervals.
     */
    public void processTick(CryptoPrice price) {
        updateCandle(price, "1m",  ChronoUnit.MINUTES, 1);
        updateCandle(price, "5m",  ChronoUnit.MINUTES, 5);
        updateCandle(price, "1h",  ChronoUnit.HOURS,   1);
    }

    private void updateCandle(CryptoPrice price, String interval,
                               ChronoUnit unit, int amount) {
        Instant openTime  = truncate(price.getTimestamp(), unit, amount);
        Instant closeTime = openTime.plus(amount, unit).minusMillis(1);

        Optional<Candle> existing = candleRepository
                .findTopBySymbolAndIntervalOrderByOpenTimeDesc(price.getSymbol(), interval);

        if (existing.isPresent() && existing.get().getOpenTime().equals(openTime)) {
            // Update the current open candle
            Candle candle = existing.get();
            candle.setHigh(Math.max(candle.getHigh(), price.getPrice()));
            candle.setLow(Math.min(candle.getLow(), price.getPrice()));
            candle.setClose(price.getPrice());
            candle.setVolume(candle.getVolume() + price.getVolume24h() / 86400.0); // approximate per-second volume
            candle.setTickCount(candle.getTickCount() + 1);
            candleRepository.save(candle);
        } else {
            // New candle period — create a fresh one
            Candle candle = new Candle();
            candle.setSymbol(price.getSymbol());
            candle.setInterval(interval);
            candle.setOpen(price.getPrice());
            candle.setHigh(price.getPrice());
            candle.setLow(price.getPrice());
            candle.setClose(price.getPrice());
            candle.setVolume(0);
            candle.setOpenTime(openTime);
            candle.setCloseTime(closeTime);
            candle.setTickCount(1);
            candleRepository.save(candle);
            log.debug("New {} candle for {} opened at {}", interval, price.getSymbol(), openTime);
        }
    }

    /**
     * Truncate an Instant to a multiple of the given unit.
     * E.g. 14:23:45 truncated to 5 minutes → 14:20:00
     */
    private Instant truncate(Instant instant, ChronoUnit unit, int amount) {
        long epochSeconds = instant.getEpochSecond();
        long unitSeconds  = unit.getDuration().getSeconds() * amount;
        long truncated    = (epochSeconds / unitSeconds) * unitSeconds;
        return Instant.ofEpochSecond(truncated);
    }

    public List<Candle> getCandles(String symbol, String interval, int limit) {
        Instant from = switch (interval) {
            case "1m" -> Instant.now().minus(limit, ChronoUnit.MINUTES);
            case "5m" -> Instant.now().minus((long) limit * 5, ChronoUnit.MINUTES);
            case "1h" -> Instant.now().minus(limit, ChronoUnit.HOURS);
            default   -> Instant.now().minus(24, ChronoUnit.HOURS);
        };
        return candleRepository.findBySymbolAndIntervalAndOpenTimeAfterOrderByOpenTimeAsc(
                symbol.toUpperCase(), interval, from);
    }
}
