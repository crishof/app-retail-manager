package com.zaphirio.retailapi.catalog.product.repository;

import com.zaphirio.retailapi.catalog.product.model.ProductPriceLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductPriceLinkRepository extends JpaRepository<ProductPriceLink, UUID> {

    Optional<ProductPriceLink> findBySupplierProductIdAndProductId(String supplierProductId, UUID productId);

    List<ProductPriceLink> findByProductId(UUID productId);

    List<ProductPriceLink> findBySupplierProductId(String supplierProductId);

    @Query("SELECT p FROM ProductPriceLink p WHERE p.priceChangeStatus IN ('UP', 'DOWN') ORDER BY p.lastPriceChangeAt DESC")
    List<ProductPriceLink> findAllWithPriceAlerts();

    @Query("SELECT p FROM ProductPriceLink p WHERE p.product.id = :productId AND p.priceChangeStatus IN ('UP', 'DOWN')")
    List<ProductPriceLink> findPriceAlertsForProduct(@Param("productId") UUID productId);
}
