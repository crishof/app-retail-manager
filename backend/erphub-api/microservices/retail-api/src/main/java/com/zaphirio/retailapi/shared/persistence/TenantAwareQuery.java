package com.zaphirio.retailapi.shared.persistence;

import org.springframework.data.jpa.domain.Specification;

/**
 * TenantAwareQuery interface for multi-tenant aware database queries.
 * 
 * Repositories that handle multi-tenant data should implement or use this interface
 * to ensure all queries are automatically filtered by tenant ID.
 * 
 * This enables row-level isolation by filtering entities based on the current
 * tenant ID in ThreadLocal context.
 * 
 * @param <T> The entity type
 */
public interface TenantAwareQuery<T> {

    /**
     * Build a Specification that filters entities by the given tenant ID.
     * 
     * Usage example in repositories:
     * <pre>
     * public List<Product> findByTenant(String tenantId) {
     *     return repository.findAll(withTenant(tenantId));
     * }
     * </pre>
     * 
     * @param tenantId The tenant ID to filter by
     * @return A Specification that filters entities by tenant
     * @throws IllegalArgumentException if tenantId is null
     */
    default Specification<T> withTenant(String tenantId) {
        return TenantAwareSpecifications.byTenant(tenantId);
    }

    /**
     * Build a Specification that combines the given specification with tenant filtering.
     * 
     * Useful for combining custom filters with mandatory tenant isolation.
     * 
     * @param spec The base specification to combine with tenant filter
     * @param tenantId The tenant ID to filter by
     * @return A combined Specification with both custom filters and tenant isolation
     */
    default Specification<T> withTenantAnd(Specification<T> spec, String tenantId) {
        return TenantAwareSpecifications.andTenant(spec, tenantId);
    }
}
