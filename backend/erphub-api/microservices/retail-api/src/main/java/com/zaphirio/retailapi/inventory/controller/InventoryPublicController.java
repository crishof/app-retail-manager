package com.zaphirio.retailapi.inventory.controller;

import com.zaphirio.retailapi.inventory.dto.StockMovementResponse;
import com.zaphirio.retailapi.inventory.model.Stock;
import com.zaphirio.retailapi.inventory.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryPublicController {

    private final StockService stockService;

    @GetMapping("/product/{productId}/stock")
    public List<Stock> getProductStock(@PathVariable UUID productId) {
        return stockService.getProductStock(productId);
    }

    @GetMapping("/movements/reference/{referenceId}")
    public List<StockMovementResponse> getMovementsByReference(@PathVariable UUID referenceId) {
        return stockService.getMovementsByReference(referenceId);
    }
}
