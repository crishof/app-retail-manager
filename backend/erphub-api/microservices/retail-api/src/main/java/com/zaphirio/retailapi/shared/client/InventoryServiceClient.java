package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.product.dto.StockMovementRequest;
import com.zaphirio.retailapi.catalog.product.dto.StockResponse;
import com.zaphirio.retailapi.inventory.service.StockService;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceStockMovementRequest;
import com.zaphirio.retailapi.operation.sales.dto.SaleStockMovementRequest;
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

    private final StockService stockService;

    public boolean hasMovementsForProduct(UUID productId) {
        try {
            return stockService.hasMovementsForProduct(productId);
        } catch (Exception e) {
            log.error("Error calling inventory service for product {}", productId, e);
            throw new BusinessException("Failed to verify inventory movements for product");
        }
    }

    public void registerMovement(StockMovementRequest request) {
        try {
            stockService.registerMovement(toStockMovementRequest(request));
        } catch (Exception e) {
            log.error("Error registering stock movement {}", request, e);
            throw new BusinessException("Failed to register stock movement");
        }
    }

    public void registerInvoiceMovement(InvoiceStockMovementRequest request) {
        try {
            stockService.registerMovement(toStockMovementRequest(request));
        } catch (Exception e) {
            log.error("Error registering invoice stock movement {}", request, e);
            throw new BusinessException("Failed to register stock movement");
        }
    }

    public void registerSaleMovement(SaleStockMovementRequest request) {
        try {
            stockService.registerMovement(toStockMovementRequest(request));
        } catch (Exception e) {
            log.error("Error registering sale stock movement {}", request, e);
            throw new BusinessException("Failed to register stock movement");
        }
    }

    public List<StockResponse> getProductStock(UUID productId) {
        try {
            var stocks = stockService.getProductStock(productId);
            return stocks.stream()
                    .map(s -> StockResponse.builder()
                            .productId(s.getProductId())
                            .branchId(s.getBranchId())
                            .locationId(s.getLocationId())
                            .quantity(s.getQuantity())
                            .build())
                    .toList();
        } catch (Exception e) {
            log.error("Error fetching stock for product {}", productId, e);
            return Collections.emptyList();
        }
    }

    private com.zaphirio.retailapi.inventory.dto.StockMovementRequest toStockMovementRequest(StockMovementRequest req) {
        return com.zaphirio.retailapi.inventory.dto.StockMovementRequest.builder()
                .productId(req.getProductId())
                .branchId(req.getBranchId())
                .locationId(req.getLocationId())
                .quantity(req.getQuantity())
                .reason(com.zaphirio.retailapi.inventory.model.StockMovementReason.ADJUSTMENT)
                .build();
    }

    private com.zaphirio.retailapi.inventory.dto.StockMovementRequest toStockMovementRequest(InvoiceStockMovementRequest req) {
        return com.zaphirio.retailapi.inventory.dto.StockMovementRequest.builder()
                .productId(req.getProductId())
                .branchId(req.getBranchId())
                .locationId(req.getLocationId())
                .quantity(req.getQuantity())
                .reason(com.zaphirio.retailapi.inventory.model.StockMovementReason.valueOf(req.getReason().name()))
                .referenceId(req.getReferenceId())
                .build();
    }

    private com.zaphirio.retailapi.inventory.dto.StockMovementRequest toStockMovementRequest(SaleStockMovementRequest req) {
        return com.zaphirio.retailapi.inventory.dto.StockMovementRequest.builder()
                .productId(req.getProductId())
                .branchId(req.getBranchId())
                .locationId(req.getLocationId())
                .quantity(req.getQuantity())
                .reason(com.zaphirio.retailapi.inventory.model.StockMovementReason.ORDER)
                .referenceId(req.getReferenceId())
                .build();
    }
}