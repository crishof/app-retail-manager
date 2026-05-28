package com.zaphirio.retailapi.catalog.brand.service;

import com.zaphirio.retailapi.shared.client.SupplierClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class BaseService {

    private final SupplierClient supplierClient;

    @CircuitBreaker(name = "supplier-sv", fallbackMethod = "getSupplierStatusFallback")
    public String getSupplierStatus() {
        return supplierClient.status(); // Call to supplier service to demonstrate circuit breaker
    }

    public String getSupplierStatusFallback(Throwable throwable) {
        log.error("Supplier service is down. Falling back to default response.", throwable);
        return "Falling back to default response";
    }
}
