package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.product.dto.StockMovementRequest;
import com.zaphirio.retailapi.catalog.product.dto.StockResponse;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceStockMovementRequest;
import com.zaphirio.retailapi.operation.sales.dto.SaleStockMovementRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class InventoryClientFallback implements InventoryClient {

    @Override
    public void registerMovement(InvoiceStockMovementRequest request) {
        log.warn("inventory-sv unavailable – stock movement NOT registered for product={} ref={}",
                request.getProductId(), request.getReferenceId());
    }

    @Override
    public void registerMovement(SaleStockMovementRequest request) {
        log.warn("inventory-sv unavailable – stock movement NOT registered for product={} ref={}",
                request.getProductId(), request.getReferenceId());
    }

    @Override
    public boolean hasMovementsForProduct(UUID productId) {
        return false;
    }

    @Override
    public void registerMovement(StockMovementRequest request) {

    }

    @Override
    public List<StockResponse> getProductStock(UUID productId) {
        return List.of();
    }
}
