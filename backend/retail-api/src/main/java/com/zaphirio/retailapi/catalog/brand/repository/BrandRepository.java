package com.zaphirio.retailapi.catalog.brand.repository;


import com.zaphirio.retailapi.catalog.brand.model.Brand;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandRepository extends TenantAwareRepository<Brand, UUID> {

    // Find including deleted brands by name
    @Query(value = "SELECT * FROM tbl_brands WHERE name = :name", nativeQuery = true)
    Optional<Brand> findByNameIncludingDeleted(@Param("name") String name);

    // Find including deleted brands by id
    @Query(value = "SELECT * FROM tbl_brands WHERE id = :id", nativeQuery = true)
    Optional<Brand> findByIdIncludingDeleted(@Param("id") UUID id);

    // Validate if a deleted brand exists by id
    @Query(value = "SELECT EXISTS (SELECT 1 FROM tbl_brands WHERE id = :id AND deleted = true)", nativeQuery = true)
    boolean existsDeletedById(@Param("id") UUID id);

    // Restore a deleted brand by id
    @Modifying
    @Query(value = "UPDATE tbl_brands SET deleted = false, deleted_at = null WHERE id = :id", nativeQuery = true)
    int restoreById(@Param("id") UUID id);

    //Set deleted at to deleted brand
    @Modifying
    @Query(value = "UPDATE tbl_brands SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id", nativeQuery = true)
    int setDeletedAt(@Param("id") UUID id);

    @Modifying
    @Query(value = "DELETE FROM tbl_brands WHERE id = :id", nativeQuery = true)
    int forceDelete(@Param("id") UUID id);
}