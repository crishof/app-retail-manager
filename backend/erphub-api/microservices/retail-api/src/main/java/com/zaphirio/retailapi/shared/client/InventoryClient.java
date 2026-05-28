package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.product.dto.StockMovementRequest;
import com.zaphirio.retailapi.catalog.product.dto.StockResponse;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceStockMovementRequest;
import com.zaphirio.retailapi.operation.sales.dto.SaleStockMovementRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "retail-api",
        contextId = "inventoryClient", fallback = InventoryClientFallback.class)
public interface InventoryClient {

    @PostMapping("/internal/inventory/movements")
    void registerMovement(@RequestBody InvoiceStockMovementRequest request);

    @PostMapping("/internal/inventory/movements")
    void registerMovement(@RequestBody SaleStockMovementRequest request);

    @GetMapping("/product/{productId}/exists")
    boolean hasMovementsForProduct(@PathVariable UUID productId);

    @PostMapping("/movements")
    void registerMovement(@RequestBody StockMovementRequest request);

    @GetMapping("/product/{productId}")
    List<StockResponse> getProductStock(@PathVariable UUID productId);

}
