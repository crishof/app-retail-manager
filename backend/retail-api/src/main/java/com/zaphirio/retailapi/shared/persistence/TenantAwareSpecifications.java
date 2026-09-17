package com.zaphirio.retailapi.shared.persistence;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Root;

/**
 * Common tenant-aware specifications for query filtering.
 *
 * Provides Specification implementations that filter entities by tenant_id.
 * These are used by all repositories implementing TenantAwareRepository to ensure
 * automatic tenant isolation at the JPA level.
 *
 * All entities must have a tenant_id column for these specifications to work.
 * The tenant_id column should be of type Long (nullable for backwards compatibility).
 */
@Slf4j
public final class TenantAwareSpecifications {

    private TenantAwareSpecifications() {
        // Utility class - prevent instantiation
    }

    /**
     * Create a Specification that filters entities by tenant ID.
     *
     * This is the core specification that ensures all tenant-aware repositories
     * are scoped to a single tenant. It should be combined with all other predicates
     * to enforce tenant isolation.
     *
     * @param <T> The entity type
     * @param tenantId The tenant ID to filter by (must not be null)
     * @return A Specification that filters by tenant_id column
     * @throws IllegalArgumentException if tenantId is null
     */
    public static <T> Specification<T> byTenant(String tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID cannot be null");
        }

        return (root, query, criteriaBuilder) -> {
            // Filter by tenant_id column - cast from String to Long if needed
            Long tenantIdAsLong = Long.parseLong(tenantId);
            return criteriaBuilder.equal(root.get("tenantId"), tenantIdAsLong);
        };
    }

    /**
     * Create a combined Specification that adds tenant filtering to an existing specification.
     *
     * Useful for complex queries that need custom filters AND tenant isolation.
     * Applies AND logic: spec AND (tenantId = :tenantId)
     *
     * @param <T> The entity type
     * @param spec The existing specification (can be null)
     * @param tenantId The tenant ID to filter by
     * @return A combined Specification with both tenant isolation and custom filters
     */
    public static <T> Specification<T> andTenant(Specification<T> spec, String tenantId) {
        Specification<T> tenantSpec = byTenant(tenantId);
        if (spec == null) {
            return tenantSpec;
        }
        return spec.and(tenantSpec);
    }
}
