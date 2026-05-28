package com.zaphirio.retailapi.operation.invoice.apiClient;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InventoryClientFallback implements InventoryClient {

    @Override
    public void registerMovement(StockMovementRequest request) {
        log.warn("inventory-sv unavailable – stock movement NOT registered for product={} ref={}",
                request.getProductId(), request.getReferenceId());
    }
}
