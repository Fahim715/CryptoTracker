package com.cryptotracker.ratelimit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Token Bucket Rate Limiter.
 *
 * CoinGecko free tier allows ~30 calls/minute.
 * We configure 10 tokens, refilling 1 token every 6 seconds (10/min),
 * giving us comfortable headroom under the limit.
 *
 * This is a classic interview-worthy implementation relevant to
 * Binance's high-throughput trading systems.
 */
@Slf4j
@Component
public class RateLimiter {

    private final int maxTokens;
    private final long refillIntervalMs;  // ms per token refill
    private final AtomicInteger tokens;
    private final AtomicLong lastRefillTime;

    public RateLimiter() {
        this.maxTokens        = 10;
        this.refillIntervalMs = 6_000L;   // 1 token every 6s = 10/min
        this.tokens           = new AtomicInteger(maxTokens);
        this.lastRefillTime   = new AtomicLong(System.currentTimeMillis());
    }

    /**
     * Try to acquire one token.
     * @return true if token acquired (request allowed), false if rate limited
     */
    public synchronized boolean tryAcquire() {
        refill();
        if (tokens.get() > 0) {
            tokens.decrementAndGet();
            log.debug("Token acquired. Remaining tokens: {}", tokens.get());
            return true;
        }
        log.warn("Rate limit hit. No tokens available. Waiting for refill.");
        return false;
    }

    /**
     * Block until a token is available, then acquire it.
     * Used when we must make the request (e.g. scheduled fetch).
     */
    public synchronized void acquireBlocking() throws InterruptedException {
        while (!tryAcquire()) {
            long waitMs = refillIntervalMs;
            log.info("Rate limited. Waiting {}ms for token refill...", waitMs);
            wait(waitMs);
        }
    }

    private void refill() {
        long now     = System.currentTimeMillis();
        long elapsed = now - lastRefillTime.get();
        int newTokens = (int) (elapsed / refillIntervalMs);

        if (newTokens > 0) {
            int refilled = Math.min(tokens.get() + newTokens, maxTokens);
            tokens.set(refilled);
            lastRefillTime.addAndGet((long) newTokens * refillIntervalMs);
            log.debug("Refilled {} token(s). Total: {}", newTokens, tokens.get());
            notifyAll();
        }
    }

    public int getAvailableTokens() {
        refill();
        return tokens.get();
    }
}
