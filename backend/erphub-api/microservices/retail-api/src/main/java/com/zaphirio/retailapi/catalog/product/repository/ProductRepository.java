package com.zaphirio.retailapi.catalog.product.repository;

import com.zaphirio.retailapi.catalog.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    // Find including deleted products by id
    @Query(value = "SELECT * FROM tbl_products WHERE id = :id", nativeQuery = true)
    Optional<Product> findByIdIncludingDeleted(@Param("id") UUID id);

    // Validate if a deleted product exists by id
    @Query(value = """
            SELECT EXISTS (
                        SELECT 1
                        FROM tbl_products
                        WHERE id = :id
                        AND deleted = true)
            """, nativeQuery = true)
    boolean existsDeletedById(@Param("id") UUID id);

    // Restore a deleted product by id
    @Modifying
    @Query(value = "UPDATE tbl_products SET deleted = false WHERE id = :id", nativeQuery = true)
    int restoreById(@Param("id") UUID id);

    // Replace product category id with another one
    @Modifying
    @Query("update Product p set p.categoryId = :to where p.categoryId = :from")
    int replaceCategory(@Param("from") UUID from, @Param("to") UUID to);

    // Find all products by brand
    List<Product> findAllByBrandId(UUID brandId);

    // Replace product brand with another one
    @Modifying
    @Query("update Product p set p.brandId = :newBrandId where p.brandId = :brandId")
    int replaceBrand(UUID brandId, UUID newBrandId);

    // Remove category id from associated products
    @Modifying
    @Query("update Product p set p.categoryId = null where p.categoryId = :categoryId")
    int clearCategory(@Param("categoryId") UUID categoryId);

    // Delete product from database
    @Modifying
    @Query(value = "DELETE FROM tbl_products WHERE id = :id", nativeQuery = true)
    int forceDelete(@Param("id") UUID id);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM tbl_products
                WHERE supplier_id = :supplierId
            )
            """, nativeQuery = true)
    boolean existsBySupplierIdIncludingDeleted(@Param("supplierId") UUID supplierId);

    @Query(value = """
            SELECT EXISTS (
            SELECT 1
            FROM tbl_products
            WHERE supplier_id = :supplierId and supplier_product_id = :productId)
            """, nativeQuery = true)
    boolean existBySupplier(UUID supplierId, UUID productId);

    @Query("""
                SELECT COUNT(p)
                FROM Product p
                WHERE (:brandId IS NULL OR p.brandId = :brandId)
                  AND (:categoryId IS NULL OR p.categoryId = :categoryId)
                  AND (:supplierId IS NULL OR p.supplierId = :supplierId)
            """)
    long countWithFilters(@Param("brandId") UUID brandId, @Param("categoryId") UUID categoryId, @Param("supplierId") UUID supplierId);

    @Modifying
    @Query("""
   update Product p
   set p.brandName = :name
   where p.brandId = :brandId
""")
    void updateBrandName(UUID brandId, String name);

    @Modifying
    @Query("""
               update Product p
               set p.brandId = null,
                   p.brandName = null
               where p.brandId = :brandId
            """)
    void clearBrandFromProducts(UUID brandId);
}
