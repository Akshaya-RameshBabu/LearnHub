package com.knowledgeVista.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, Long> blockedIPs = new ConcurrentHashMap<>();
    private static final int REQUESTS_PER_MINUTE = 100;

    @Bean
    public Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.simple(REQUESTS_PER_MINUTE, Duration.ofMinutes(1));
        return Bucket4j.builder()
                .addLimit(limit)
                .build();
    }

    public Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, k -> createNewBucket());
    }

    public boolean tryConsume(String key) {
        Bucket bucket = resolveBucket(key);
        return bucket.tryConsume(1);
    }

    public void blockIP(String ip) {
        blockedIPs.put(ip, System.currentTimeMillis() + Duration.ofHours(24).toMillis());
    }

    public boolean isIPBlocked(String ip) {
        Long blockUntil = blockedIPs.get(ip);
        if (blockUntil == null) {
            return false;
        }
        
        // Remove expired blocks
        if (System.currentTimeMillis() > blockUntil) {
            blockedIPs.remove(ip);
            return false;
        }
        
        return true;
    }
} 