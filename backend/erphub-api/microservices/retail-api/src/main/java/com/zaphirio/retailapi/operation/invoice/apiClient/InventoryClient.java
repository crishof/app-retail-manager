package com.zaphirio.retailapi.operation.invoice.apiClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-sv", fallback = InventoryClientFallback.class)
public interface InventoryClient {

    @PostMapping("/internal/inventory/movements")
    void registerMovement(@RequestBody StockMovementRequest request);
}
