package com.cryptotracker.repository;

import com.cryptotracker.model.Candle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandleRepository extends MongoRepository<Candle, String> {

    List<Candle> findBySymbolAndIntervalAndOpenTimeAfterOrderByOpenTimeAsc(
            String symbol, String interval, Instant after);

    Optional<Candle> findTopBySymbolAndIntervalOrderByOpenTimeDesc(
            String symbol, String interval);
}
