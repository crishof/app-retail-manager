package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.catalog.product.dto.StockMovementRequest;
import com.zaphirio.retailapi.catalog.product.dto.StockResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "inventory-sv", path = "/internal/inventory")
public interface InventoryClient {

    @GetMapping("/product/{productId}/exists")
    boolean hasMovementsForProduct(@PathVariable UUID productId);

    @PostMapping("/movements")
    void registerMovement(@RequestBody StockMovementRequest request);

    @GetMapping("/product/{productId}")
    List<StockResponse> getProductStock(@PathVariable UUID productId);
}