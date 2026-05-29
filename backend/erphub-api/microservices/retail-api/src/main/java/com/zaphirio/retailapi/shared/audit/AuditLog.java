package com.zaphirio.retailapi.shared.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a single audit log entry.
 *
 * Records all modifications to entities in the system, enabling:
 * - Complete audit trail for compliance
 * - Forensic analysis of data changes
 * - Rollback capability (restoration of previous versions)
 * - Accountability (who made what change when)
 *
 * Immutable: Once created, audit entries cannot be modified or deleted.
 */
@Entity
@Table(name = "tbl_audit_log", indexes = {
        @Index(name = "idx_audit_tenant", columnList = "tenant_id"),
        @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_timestamp", columnList = "created_at"),
        @Index(name = "idx_audit_user", columnList = "performed_by_id")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Tenant ID for multi-tenant isolation.
     */
    @Column(nullable = false)
    private Long tenantId;

    /**
     * Type of entity that was modified (e.g., "INVOICE", "PRODUCT", "USER").
     */
    @Column(nullable = false, length = 100)
    private String entityType;

    /**
     * ID of the entity that was modified.
     * Can be UUID or numeric ID converted to string.
     */
    @Column(nullable = false, length = 36)
    private String entityId;

    /**
     * Action performed: CREATE, UPDATE, DELETE, FINALIZE, CANCEL, etc.
     */
    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private AuditAction action;

    /**
     * JSON serialized representation of field changes.
     *
     * Format: { "fieldName": { "oldValue": "...", "newValue": "..." }, ... }
     *
     * For CREATE: only "newValue" for each field.
     * For DELETE: only "oldValue" for each field.
     * For UPDATE: both "oldValue" and "newValue".
     */
    @Column(columnDefinition = "TEXT")
    private String changes;

    /**
     * Description of the change (human-readable summary).
     *
     * Examples:
     * - "Invoice finalized and locked"
     * - "Invoice amount updated from 100.00 to 120.00"
     * - "Invoice canceled due to supplier error"
     */
    @Column(length = 500)
    private String description;

    /**
     * UUID of the user who performed the action.
     * Can be null for system-generated actions.
     */
    @Column(length = 36)
    private String performedByUserId;

    /**
     * Name/email of the user who performed the action (for quick reference).
     */
    @Column(length = 150)
    private String performedByName;

    /**
     * IP address from which the action was performed.
     * Useful for security audit trail.
     */
    @Column(length = 45) // IPv6 max length
    private String sourceIpAddress;

    /**
     * Timestamp when the action was performed (server time, always UTC).
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Additional metadata as JSON.
     *
     * Can contain:
     * - Session ID
     * - Request ID
     * - Additional context
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    /**
     * Whether this audit log entry is for a finalized/immutable document.
     *
     * Used to prevent modification of audit records for finalized documents.
     */
    @Column(nullable = false)
    private Boolean isForFinalizedDocument = false;
}
