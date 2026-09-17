package com.zaphirio.retailapi.catalog.pricing.repository;

import com.zaphirio.retailapi.catalog.pricing.model.Price;
import com.zaphirio.retailapi.catalog.pricing.model.PriceType;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceRepository extends TenantAwareRepository<Price, UUID> {

    Optional<Price> findByProductIdAndType(UUID productId, PriceType type);

    List<Price> findByProductId(UUID productId);

    Optional<Price> findByProductIdAndTypeAndActiveTrue(UUID productId, PriceType type);
}