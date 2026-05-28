package com.zaphirio.retailapi.party.supplier.repository;

import com.zaphirio.retailapi.party.supplier.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    // Find by name including deleted records
    @Query(value = """
            SELECT * FROM tbl_suppliers
            WHERE name = :name
            """, nativeQuery = true)
    Optional<Supplier> findByNameIncludingDeleted(@Param("name") String name);

    // Find by id including deleted records
    @Query(value = """
            SELECT * FROM tbl_suppliers
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Supplier> findByIdIncludingDeleted(@Param("id") UUID id);

    // Validate if a deleted supplier exists by id
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM tbl_suppliers
                WHERE id = :id AND deleted = true
            )
            """, nativeQuery = true)
    boolean existsDeletedById(@Param("id") UUID id);

    // Restore a deleted supplier by id
    @Modifying
    @Query(value = """
            UPDATE tbl_suppliers
            SET deleted = false,
                deleted_at = NULL
            WHERE id = :id
            """, nativeQuery = true)
    int restoreById(@Param("id") UUID id);

    @Modifying
    @Query(value = "DELETE FROM tbl_suppliers WHERE id = :id", nativeQuery = true)
    int forceDelete(@Param("id") UUID id);
}
