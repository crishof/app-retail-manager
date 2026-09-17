package com.zaphirio.retailapi.party.customer.repository;

import com.zaphirio.retailapi.party.customer.model.Customer;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends TenantAwareRepository<Customer, UUID> {

    // Find including deleted customers by dni
    @Query(value = """
            SELECT * FROM tbl_customers
            WHERE dni = :dni
            """, nativeQuery = true)
    Optional<Customer> findByDniIncludingDeleted(@Param("dni") String dni);

    // Find including deleted customers by id
    @Query(value = """
            SELECT * FROM tbl_customers
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Customer> findByIdIncludingDeleted(@Param("id") UUID id);

    // Validate if a deleted customer exists by id
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM tbl_customers
                WHERE id = :id AND deleted = true
            )
            """, nativeQuery = true)
    boolean existsDeletedById(@Param("id") UUID id);

    // Restore a deleted customer by id
    @Modifying
    @Query(value = """
            UPDATE tbl_customers
            SET deleted = false,
                deleted_at = NULL
            WHERE id = :id
            """, nativeQuery = true)
    int restoreById(@Param("id") UUID id);

    //Set deleted at to deleted customer
    @Modifying
    @Query(value = "UPDATE tbl_customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id", nativeQuery = true)
    int setDeletedAt(@Param("id") UUID id);

    @Modifying
    @Query(value = "DELETE FROM tbl_customers WHERE id = :id", nativeQuery = true)
    int forceDelete(@Param("id") UUID id);

    @Query(value = """
            SELECT * FROM tbl_customers
            WHERE deleted = false
            AND (LOWER(name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(lastname) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(dni) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(tax_id) LIKE LOWER(CONCAT('%', :search, '%')))
            """, nativeQuery = true)
    java.util.List<Customer> searchByTerm(@Param("search") String search);
}