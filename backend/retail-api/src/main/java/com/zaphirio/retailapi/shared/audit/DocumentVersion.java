package com.zaphirio.retailapi.shared.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a single version of a document.
 *
 * Maintains complete version history for documents (invoices, etc.),
 * enabling:
 * - Tracking all modifications to a document
 * - Rollback to previous versions if needed
 * - Complete audit trail of document evolution
 * - Compliance with requirements to maintain historical records
 *
 * Each time a document is modified before finalization, a new version is created.
 * Once finalized, no more versions can be created.
 */
@Entity
@Table(name = "tbl_document_version", indexes = {
        @Index(name = "idx_docver_tenant", columnList = "tenant_id"),
        @Index(name = "idx_docver_document", columnList = "document_type, document_id"),
        @Index(name = "idx_docver_version", columnList = "document_id, version_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVersion implements Serializable {

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
     * Type of document (e.g., "INVOICE", "PURCHASE_ORDER", "QUOTATION").
     */
    @Column(nullable = false, length = 100)
    private String documentType;

    /**
     * ID of the main document.
     */
    @Column(nullable = false, length = 36)
    private String documentId;

    /**
     * Version number (1, 2, 3, ...).
     * Incremented for each modification before finalization.
     */
    @Column(nullable = false)
    private Integer versionNumber;

    /**
     * Complete snapshot of document state at this version.
     *
     * Stored as JSON containing all relevant fields.
     * Enables complete rollback if needed.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String documentSnapshot;

    /**
     * Summary of changes in this version compared to previous version.
     *
     * Format: { "fieldName": "change description", ... }
     * Examples:
     * - "amount": "Updated from 100.00 to 120.00"
     * - "status": "Changed from DRAFT to PENDING_APPROVAL"
     */
    @Column(columnDefinition = "TEXT")
    private String changeSummary;

    /**
     * Reason for this version (e.g., "Corrected supplier details", "Updated amount").
     *
     * Optional field explaining why this version was created.
     */
    @Column(length = 500)
    private String changeReason;

    /**
     * UUID of user who created this version.
     */
    @Column(length = 36)
    private String createdByUserId;

    /**
     * Name/email of user who created this version.
     */
    @Column(length = 150)
    private String createdByName;

    /**
     * Timestamp when this version was created.
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Whether this is the current/latest version of the document.
     *
     * Only one version per document should have this as true.
     * Useful for quick identification of current state.
     */
    @Column(nullable = false)
    private Boolean isCurrentVersion = false;

    /**
     * Whether this version represents a finalized/immutable state.
     *
     * Once true, no more modifications to this document are allowed.
     */
    @Column(nullable = false)
    private Boolean isFinalizedVersion = false;

    /**
     * Hash of document snapshot for integrity verification.
     *
     * SHA-256 hash of documentSnapshot.
     * Prevents tampering with audit records.
     */
    @Column(length = 64)
    private String snapshotHash;
}
