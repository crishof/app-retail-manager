package com.zaphirio.retailapi.catalog.supplierCatalog.repository;


import com.zaphirio.retailapi.catalog.supplierCatalog.model.SupplierPriceItem;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierPriceItemRepository extends TenantAwareRepository<SupplierPriceItem, UUID> {

    SupplierPriceItem findProductByBrandAndSupplierCodeAndSupplierId(String brand, String supplierCode, UUID supplierId);

    @Query(value = "SELECT * FROM tbl_supplier_price_item " +
            "WHERE brand ILIKE CONCAT('%', :filter, '%') " +
            "OR model ILIKE CONCAT('%', :filter, '%') " +
            "OR description ILIKE CONCAT('%', :filter, '%')",
            nativeQuery = true)
    List<SupplierPriceItem> findAllByBrandContainingOrModelContainingOrDescriptionContaining(@Param("filter") String filter);

    List<SupplierPriceItem> findAllByBrand(String brand);

    @Query(value = "SELECT * FROM tbl_supplier_price_item " +
            "WHERE brand LIKE :brand " +
            "AND (model ILIKE CONCAT('%', :filter, '%') " +
            "OR description ILIKE CONCAT('%', :filter, '%'))",
            nativeQuery = true)
    List<SupplierPriceItem> findAllByBrandAndModelContainingOrDescriptionContaining(@Param("brand") String brand, @Param("filter") String filter);

    List<SupplierPriceItem> findAllBySupplierId(UUID supplierId);

    @Query(value = "SELECT * FROM tbl_supplier_price_item " +
            "WHERE supplier_id = :supplierId " +
            "AND (brand ILIKE CONCAT('%', :filter, '%') " +
            "OR model ILIKE CONCAT('%', :filter, '%') " +
            "OR description ILIKE CONCAT('%', :filter, '%'))",
            nativeQuery = true)
    List<SupplierPriceItem> findAllBySupplierIdAndBrandContainingOrModelContainingOrDescriptionContaining(UUID supplierId, String filter);

    List<SupplierPriceItem> findAllBySupplierIdAndBrand(UUID supplierId, String brand);

    @Query(value = "SELECT * FROM tbl_supplier_price_item " +
            "WHERE supplier_id = :supplierId " +
            "AND (brand LIKE :brand " +
            "AND (model ILIKE CONCAT('%', :filter, '%') " +
            "OR description ILIKE CONCAT('%', :filter, '%')))",
            nativeQuery = true)
    List<SupplierPriceItem> findAllBySupplierIdAndBrandAndCodeContainingOrDescriptionContaining(UUID supplierId, String brand, String filter);
}
