package com.zaphirio.retailapi.inventory.repository;

import com.zaphirio.retailapi.inventory.model.StockMovement;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends TenantAwareRepository<StockMovement, UUID> {

    List<StockMovement> findByProductId(UUID productId);

    List<StockMovement> findByReferenceId(UUID referenceId);

    boolean existsByProductId(UUID productId);
}