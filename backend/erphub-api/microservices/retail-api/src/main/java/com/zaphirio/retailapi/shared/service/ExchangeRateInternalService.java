package com.zaphirio.retailapi.shared.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExchangeRateInternalService {

    // TODO: Implement exchange rate service or integrate with external provider
    // For now, using fallback rates
    private static final java.util.Map<String, BigDecimal> FALLBACK_RATES = java.util.Map.of(
            "ARS", BigDecimal.ONE,
            "USD", BigDecimal.valueOf(1100),
            "EUR", BigDecimal.valueOf(1200)
    );

    public BigDecimal getExchangeRate(String from, String to) {
        if (from.equalsIgnoreCase(to)) {
            return BigDecimal.ONE;
        }
        
        // TODO: Implement actual exchange rate fetching from exchange-sv when available
        return FALLBACK_RATES.getOrDefault(to, BigDecimal.valueOf(1000));
    }
}
