package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.catalog.product.dto.StockMovementRequest;
import com.zaphirio.retailapi.catalog.product.dto.StockResponse;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceClient {

    private final InventoryClient inventoryClient;

    public boolean hasMovementsForProduct(UUID productId) {
        try {
            return inventoryClient.hasMovementsForProduct(productId);
        } catch (Exception e) {
            log.error("Error calling inventory-sv for product {}", productId, e);
            throw new BusinessException("Failed to verify inventory movements for product");
        }
    }

    public void registerMovement(StockMovementRequest request) {
        try {
            inventoryClient.registerMovement(request);
        } catch (Exception e) {
            log.error("Error registering stock movement {}", request, e);
            throw new BusinessException("Failed to register stock movement");
        }
    }

    public List<StockResponse> getProductStock(UUID productId) {
        try {
            return inventoryClient.getProductStock(productId);
        } catch (Exception e) {
            log.error("Error fetching stock for product {}", productId, e);
            return Collections.emptyList();
        }
    }
}