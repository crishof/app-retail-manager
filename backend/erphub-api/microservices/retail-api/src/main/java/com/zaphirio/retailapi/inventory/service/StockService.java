package com.zaphirio.retailapi.inventory.service;

import com.zaphirio.retailapi.inventory.dto.StockMovementRequest;
import com.zaphirio.retailapi.inventory.dto.StockMovementResponse;
import com.zaphirio.retailapi.inventory.model.Stock;

import java.util.List;
import java.util.UUID;

public interface StockService {

    void registerMovement(StockMovementRequest req);

    Stock createStock(StockMovementRequest req);

    List<Stock> getProductStock(UUID productId);

    List<Stock> getProductsStock(List<UUID> productIds);

    List<StockMovementResponse> getMovementsByReference(UUID referenceId);
}
