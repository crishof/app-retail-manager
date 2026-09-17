package com.zaphirio.retailapi.inventory.service;

import com.zaphirio.retailapi.inventory.dto.StockMovementRequest;
import com.zaphirio.retailapi.inventory.dto.StockMovementResponse;
import com.zaphirio.retailapi.inventory.model.Stock;
import com.zaphirio.retailapi.inventory.model.StockMovement;
import com.zaphirio.retailapi.inventory.repository.StockMovementRepository;
import com.zaphirio.retailapi.inventory.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;
    private final StockMovementRepository movementRepository;

    @Override
    @Transactional
    public void registerMovement(StockMovementRequest req) {

        log.info("Registering stock movement | product={} qty={} reason={}", req.getProductId(), req.getQuantity(), req.getReason());

        Stock stock = stockRepository.findByProductIdAndBranchIdAndLocationId(req.getProductId(), req.getBranchId(), req.getLocationId()).orElseGet(() -> createStock(req));

        stock.applyMovement(req.getQuantity());
        stockRepository.save(stock);

        StockMovement movement = StockMovement.builder().stockId(stock.getId()).productId(req.getProductId()).branchId(req.getBranchId()).locationId(req.getLocationId()).quantity(req.getQuantity()).reason(req.getReason()).referenceId(req.getReferenceId()).createdAt(Instant.now()).build();

        movementRepository.save(movement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Stock> getProductStock(UUID productId) {
        return stockRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Stock> getProductsStock(List<UUID> productIds) {
        return stockRepository.findByProductIdIn(productIds);
    }

    @Transactional
    public Stock createStock(StockMovementRequest req) {
        return stockRepository.save(Stock.builder().productId(req.getProductId()).branchId(req.getBranchId()).locationId(req.getLocationId()).quantity(0).updatedAt(Instant.now()).build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementResponse> getMovementsByReference(UUID referenceId) {
        return movementRepository.findByReferenceId(referenceId).stream()
                .map(m -> StockMovementResponse.builder()
                        .id(m.getId())
                        .productId(m.getProductId())
                        .branchId(m.getBranchId())
                        .locationId(m.getLocationId())
                        .quantity(m.getQuantity())
                        .reason(m.getReason())
                        .referenceId(m.getReferenceId())
                        .createdAt(m.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMovementsForProduct(UUID productId) {
        return movementRepository.existsByProductId(productId);
    }
}

