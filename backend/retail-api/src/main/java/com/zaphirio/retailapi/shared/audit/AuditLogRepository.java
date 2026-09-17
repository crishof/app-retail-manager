package com.zaphirio.retailapi.shared.audit;

import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository for audit log entries.
 *
 * Extends TenantAwareRepository to ensure all audit logs are scoped to the current tenant.
 * Audit logs are immutable records and cannot be modified after creation.
 */
@Repository
public interface AuditLogRepository extends TenantAwareRepository<AuditLog, UUID> {

    /**
     * Find all audit logs for a specific entity.
     *
     * @param tenantId The tenant ID
     * @param entityType Type of entity (e.g., "INVOICE")
     * @param entityId ID of the entity
     * @return List of audit logs for the entity, ordered by timestamp
     */
    List<AuditLog> findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
            Long tenantId, String entityType, String entityId
    );

    /**
     * Find all audit logs for a user within a date range.
     *
     * @param tenantId The tenant ID
     * @param userId The user who performed the actions
     * @param startTime Start of date range
     * @param endTime End of date range
     * @return List of audit logs for the user
     */
    List<AuditLog> findByTenantIdAndPerformedByUserIdAndCreatedAtBetween(
            Long tenantId, String userId, Instant startTime, Instant endTime
    );

    /**
     * Find all audit logs for a specific entity type.
     *
     * @param tenantId The tenant ID
     * @param entityType Type of entity
     * @return List of audit logs for the entity type
     */
    List<AuditLog> findByTenantIdAndEntityTypeOrderByCreatedAtDesc(
            Long tenantId, String entityType
    );

    /**
     * Find all audit logs for finalized documents.
     *
     * @param tenantId The tenant ID
     * @param isFinalizedDocument Whether logs are for finalized documents
     * @return List of audit logs for finalized documents
     */
    List<AuditLog> findByTenantIdAndIsForFinalizedDocumentOrderByCreatedAtDesc(
            Long tenantId, Boolean isFinalizedDocument
    );
}
