package com.cryptotracker.repository;

import com.cryptotracker.model.CryptoPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CryptoPriceRepository extends MongoRepository<CryptoPrice, String> {

    // Get latest price for a symbol
    Optional<CryptoPrice> findTopBySymbolOrderByTimestampDesc(String symbol);

    // Get price history for a symbol within a time range
    List<CryptoPrice> findBySymbolAndTimestampBetweenOrderByTimestampAsc(
            String symbol, Instant from, Instant to);

    // Get all distinct latest prices (one per symbol)
    List<CryptoPrice> findTop10ByOrderByTimestampDesc();
}
