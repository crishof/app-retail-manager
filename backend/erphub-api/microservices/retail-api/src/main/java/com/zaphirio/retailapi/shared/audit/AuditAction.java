package com.zaphirio.retailapi.shared.audit;

/**
 * Enumeration of audit actions that can be logged.
 *
 * Tracks specific operations performed on entities in the system,
 * enabling detailed audit trails for compliance and forensics.
 */
public enum AuditAction {

    /**
     * Entity creation.
     * Triggered when a new entity is created.
     */
    CREATE("Entity created"),

    /**
     * Entity modification.
     * Triggered when entity fields are updated.
     */
    UPDATE("Entity updated"),

    /**
     * Entity deletion (soft or hard).
     * Triggered when entity is deleted.
     */
    DELETE("Entity deleted"),

    /**
     * Invoice/document finalization.
     * Triggered when invoice is marked as FINALIZED (immutable).
     */
    FINALIZE("Document finalized and locked"),

    /**
     * Invoice/document cancellation.
     * Triggered when invoice is canceled (cannot be reopened).
     */
    CANCEL("Document canceled"),

    /**
     * Approval step (for multi-step approval workflows).
     * Triggered when document is approved.
     */
    APPROVE("Document approved"),

    /**
     * Rejection of a document or change.
     */
    REJECT("Document rejected"),

    /**
     * Restoration of a previously deleted entity.
     */
    RESTORE("Entity restored"),

    /**
     * Status transition (e.g., DRAFT -> PENDING -> APPROVED).
     */
    STATUS_CHANGE("Status changed"),

    /**
     * Bulk operation affecting multiple entities.
     */
    BULK_UPDATE("Bulk operation performed"),

    /**
     * System-initiated action (automatic processing).
     */
    SYSTEM_ACTION("System-initiated action"),

    /**
     * Data export operation.
     * Tracks when data is exported for compliance.
     */
    DATA_EXPORT("Data exported"),

    /**
     * Report generation.
     * Tracks when reports are generated.
     */
    REPORT_GENERATED("Report generated");

    private final String description;

    AuditAction(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
