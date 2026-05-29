package com.zaphirio.retailapi.catalog.product.repository;

import com.zaphirio.retailapi.catalog.product.model.ProductPriceHistory;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.UUID;

public interface ProductPriceHistoryRepository extends TenantAwareRepository<ProductPriceHistory, UUID> {

    List<ProductPriceHistory> findByLinkIdOrderByRecordedAtDesc(UUID linkId);
}
