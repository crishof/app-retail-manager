package com.zaphirio.retailapi.shared.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaphirio.retailapi.shared.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Comprehensive audit logging service for fiscal compliance.
 *
 * Provides centralized audit trail recording for all entity modifications,
 * enabling:
 * - Complete change history (who/what/when/why)
 * - Forensic analysis of data changes
 * - Compliance with tax authority requirements (AFIP, etc.)
 * - Rollback capability via audit snapshots
 *
 * All audit logs are immutable and tenant-scoped.
 */
@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper;

    /**
     * Log an entity creation event.
     *
     * Records all field values for newly created entity.
     *
     * @param entityType Type of entity (e.g., "INVOICE", "PRODUCT")
     * @param entityId ID of the created entity
     * @param newValues Map of field names to new values
     * @param description Human-readable description of the change
     */
    public void logCreate(
            String entityType,
            String entityId,
            Map<String, Object> newValues,
            String description
    ) {
        logAuditEntry(
                entityType,
                entityId,
                AuditAction.CREATE,
                null,
                newValues,
                description,
                false
        );
    }

    /**
     * Log an entity modification event.
     *
     * Records old and new values for modified fields.
     *
     * @param entityType Type of entity
     * @param entityId ID of the modified entity
     * @param oldValues Map of field names to old values
     * @param newValues Map of field names to new values
     * @param description Human-readable description of the change
     */
    public void logUpdate(
            String entityType,
            String entityId,
            Map<String, Object> oldValues,
            Map<String, Object> newValues,
            String description
    ) {
        logAuditEntry(
                entityType,
                entityId,
                AuditAction.UPDATE,
                oldValues,
                newValues,
                description,
                false
        );
    }

    /**
     * Log an entity deletion event.
     *
     * Records all field values for deleted entity.
     *
     * @param entityType Type of entity
     * @param entityId ID of the deleted entity
     * @param deletedValues Map of field names to values at deletion time
     * @param description Human-readable description of the deletion
     */
    public void logDelete(
            String entityType,
            String entityId,
            Map<String, Object> deletedValues,
            String description
    ) {
        logAuditEntry(
                entityType,
                entityId,
                AuditAction.DELETE,
                deletedValues,
                null,
                description,
                false
        );
    }

    /**
     * Log document finalization event.
     *
     * Records when a document (invoice, etc.) is finalized and locked.
     * Marks audit entry as "for finalized document" for compliance tracking.
     *
     * @param entityType Type of document
     * @param entityId ID of the document
     * @param finalValues Final field values
     */
    public void logFinalization(
            String entityType,
            String entityId,
            Map<String, Object> finalValues
    ) {
        logAuditEntry(
                entityType,
                entityId,
                AuditAction.FINALIZE,
                null,
                finalValues,
                "Document finalized and locked for modifications",
                true // Mark as for finalized document
        );
    }

    /**
     * Log document cancellation event.
     *
     * Records when a document is canceled with reason.
     *
     * @param entityType Type of document
     * @param entityId ID of the document
     * @param cancellationReason Reason for cancellation
     * @param previousValues Field values before cancellation
     */
    public void logCancellation(
            String entityType,
            String entityId,
            String cancellationReason,
            Map<String, Object> previousValues
    ) {
        Map<String, Object> cancelData = new HashMap<>();
        cancelData.put("reason", cancellationReason);
        cancelData.putAll(previousValues);

        logAuditEntry(
                entityType,
                entityId,
                AuditAction.CANCEL,
                previousValues,
                cancelData,
                "Document canceled: " + cancellationReason,
                true // Mark as for finalized document
        );
    }

    /**
     * Log a generic audit event.
     *
     * @param entityType Type of entity
     * @param entityId ID of the entity
     * @param action Action performed
     * @param description Description of the action
     */
    public void logAction(
            String entityType,
            String entityId,
            AuditAction action,
            String description
    ) {
        logAuditEntry(
                entityType,
                entityId,
                action,
                null,
                null,
                description,
                false
        );
    }

    /**
     * Retrieve complete audit history for an entity.
     *
     * @param entityType Type of entity
     * @param entityId ID of the entity
     * @return List of audit logs ordered by timestamp (newest first)
     */
    public List<AuditLog> getEntityHistory(String entityType, String entityId) {
        Long tenantId = Long.parseLong(TenantContext.getTenantId());
        return auditLogRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
                tenantId, entityType, entityId
        );
    }

    /**
     * Retrieve audit logs for a specific user within a date range.
     *
     * Useful for compliance reporting and user activity analysis.
     *
     * @param userId The user ID
     * @param startTime Start of date range
     * @param endTime End of date range
     * @return List of audit logs for the user
     */
    public List<AuditLog> getUserActivity(String userId, Instant startTime, Instant endTime) {
        Long tenantId = Long.parseLong(TenantContext.getTenantId());
        return auditLogRepository.findByTenantIdAndPerformedByUserIdAndCreatedAtBetween(
                tenantId, userId, startTime, endTime
        );
    }

    /**
     * Retrieve all audit logs for an entity type.
     *
     * Useful for compliance reports and data analysis.
     *
     * @param entityType Type of entity (e.g., "INVOICE")
     * @return List of audit logs for the entity type
     */
    public List<AuditLog> getEntityTypeHistory(String entityType) {
        Long tenantId = Long.parseLong(TenantContext.getTenantId());
        return auditLogRepository.findByTenantIdAndEntityTypeOrderByCreatedAtDesc(
                tenantId, entityType
        );
    }

    /**
     * Retrieve audit logs for finalized documents (for compliance).
     *
     * Useful for financial/tax reporting where only finalized documents are reported.
     *
     * @return List of audit logs for finalized documents
     */
    public List<AuditLog> getFinalizedDocumentAuditTrail() {
        Long tenantId = Long.parseLong(TenantContext.getTenantId());
        return auditLogRepository.findByTenantIdAndIsForFinalizedDocumentOrderByCreatedAtDesc(
                tenantId, true
        );
    }

    /**
     * Internal method: Create and persist audit log entry.
     */
    private void logAuditEntry(
            String entityType,
            String entityId,
            AuditAction action,
            Map<String, Object> oldValues,
            Map<String, Object> newValues,
            String description,
            boolean isForFinalizedDocument
    ) {
        try {
            Long tenantId = Long.parseLong(TenantContext.getTenantId());
            String userId = TenantContext.getUserId();

            // Build changes map combining old and new values
            Map<String, Map<String, Object>> changesMap = new HashMap<>();
            if (oldValues != null) {
                oldValues.forEach((key, value) ->
                        changesMap.computeIfAbsent(key, k -> new HashMap<>())
                                .put("oldValue", value)
                );
            }
            if (newValues != null) {
                newValues.forEach((key, value) ->
                        changesMap.computeIfAbsent(key, k -> new HashMap<>())
                                .put("newValue", value)
                );
            }

            String changesJson = changesMap.isEmpty() ? null :
                    objectMapper.writeValueAsString(changesMap);

            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .changes(changesJson)
                    .description(description)
                    .performedByUserId(userId)
                    .performedByName("User: " + userId) // Will be populated with actual name if available
                    .createdAt(Instant.now())
                    .isForFinalizedDocument(isForFinalizedDocument)
                    .build();

            auditLogRepository.save(auditLog);

            log.info(
                    "Audit log created: tenant={}, entity={}, entityId={}, action={}, description={}",
                    tenantId, entityType, entityId, action, description
            );
        } catch (Exception e) {
            log.error(
                    "Failed to create audit log: entity={}, entityId={}, action={}",
                    entityType, entityId, action, e
            );
            throw new RuntimeException("Audit logging failed", e);
        }
    }
}
