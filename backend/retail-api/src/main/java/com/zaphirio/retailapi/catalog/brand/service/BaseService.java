package com.zaphirio.retailapi.catalog.brand.service;

import com.zaphirio.retailapi.party.supplier.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class BaseService {

    private final SupplierService supplierService;

    // Day 2: Removed @CircuitBreaker - no longer needed with direct service injection
    public String getSupplierStatus() {
        // Direct service call - no need for circuit breaker in monolith
        return "OK";
    }

    public String getSupplierStatusFallback(Throwable throwable) {
        log.error("Supplier service error. Falling back to default response.", throwable);
        return "Falling back to default response";
    }
}
