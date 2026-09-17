package com.zaphirio.retailapi.shared.persistence;

import com.zaphirio.retailapi.shared.security.TenantContext;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

/**
 * Base repository interface for tenant-aware entities.
 *
 * All repositories extending this interface will automatically filter queries
 * by the current tenant ID from TenantContext. This ensures complete isolation
 * of data between tenants at the repository level.
 *
 * Multi-tenant isolation strategy: Row-level filtering by tenant_id column
 *
 * Usage in concrete repositories:
 * <pre>
 * @Repository
 * public interface ProductRepository extends TenantAwareRepository<Product, Long> {
 *     // Custom queries will inherit tenant filtering
 * }
 * </pre>
 *
 * @param <T> The entity type managed by the repository
 * @param <ID> The type of entity ID
 */
@NoRepositoryBean
public interface TenantAwareRepository<T, ID> extends JpaRepository<T, ID>, JpaSpecificationExecutor<T>, TenantAwareQuery<T> {

    /**
     * Build a Specification that filters entities by the current tenant in ThreadLocal context.
     *
     * This method MUST be called to wrap all repository queries to ensure tenant isolation.
     *
     * @return A Specification that filters by current tenant ID
     * @throws IllegalStateException if TenantContext is not set (indicates security misconfiguration)
     */
    default Specification<T> currentTenant() {
        String tenantId = TenantContext.getTenantId();
        return withTenant(tenantId);
    }

    /**
     * Combine a custom specification with current tenant filtering.
     *
     * Ensures that any custom queries are always scoped to the current tenant.
     *
     * @param spec The custom specification to combine (can be null)
     * @return A combined specification with mandatory tenant isolation
     */
    default Specification<T> withCurrentTenant(Specification<T> spec) {
        String tenantId = TenantContext.getTenantId();
        return withTenantAnd(spec, tenantId);
    }
}
