package com.cryptotracker.repository;

import com.cryptotracker.model.PriceAlert;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAlertRepository extends MongoRepository<PriceAlert, String> {
    List<PriceAlert> findByTriggeredFalse();
    List<PriceAlert> findBySymbolOrderByCreatedAtDesc(String symbol);
    List<PriceAlert> findAllByOrderByCreatedAtDesc();
}
