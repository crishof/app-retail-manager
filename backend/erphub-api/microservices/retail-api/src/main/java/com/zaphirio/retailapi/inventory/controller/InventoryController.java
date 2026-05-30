package com.zaphirio.retailapi.inventory.controller;

import com.zaphirio.retailapi.inventory.dto.StockMovementRequest;
import com.zaphirio.retailapi.inventory.model.Stock;
import com.zaphirio.retailapi.inventory.service.StockService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/inventory")
@RequiredArgsConstructor
@Hidden
public class InventoryController {

    private final StockService stockService;

    @PostMapping("/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> registerMovement(@RequestBody @Valid StockMovementRequest request) {
        stockService.registerMovement(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<Stock> getProductStock(@PathVariable UUID productId) {
        return stockService.getProductStock(productId);
    }

    @GetMapping("/products/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<Stock>> getProductsStock(@RequestParam("productIds") List<UUID> productIds) {
        return ResponseEntity.ok(stockService.getProductsStock(productIds));
    }
}
