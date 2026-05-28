package com.zaphirio.retailapi.operation.sales.apiClient;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class InventoryClientFallback implements InventoryClient {

    @Override
    public void registerMovement(StockMovementRequest request) {
        log.warn("inventory-sv unavailable — stock movement not registered for product={}", request.getProductId());
        throw new IllegalStateException("No se pudo registrar el movimiento de stock. Intente nuevamente.");
    }
}
