package com.zaphirio.retailapi.inventory.repository;

import com.zaphirio.retailapi.inventory.model.Stock;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockRepository extends TenantAwareRepository<Stock, UUID> {

    Optional<Stock> findByProductIdAndBranchIdAndLocationId(UUID productId, UUID branchId, UUID locationId);

    List<Stock> findByProductId(UUID productId);

    List<Stock> findByProductIdIn(List<UUID> productIds);
}