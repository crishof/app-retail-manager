package com.zaphirio.retailapi.shared.fiscal;

/**
 * Invoice finalization status for fiscal compliance.
 *
 * Defines the lifecycle states of invoices and other fiscal documents:
 * DRAFT -> PENDING_APPROVAL -> APPROVED -> FINALIZED (immutable)
 *
 * Once FINALIZED, an invoice cannot be modified. Only cancellation or
 * credit note creation is allowed.
 */
public enum DocumentFinalizationStatus {

    /**
     * Document is being created and can be freely edited.
     * No validation enforced yet.
     */
    DRAFT("Document is in draft status and can be edited", true),

    /**
     * Document is complete and awaiting approval.
     * Can still be edited, but approval is pending.
     */
    PENDING_APPROVAL("Document is pending approval", true),

    /**
     * Document has been approved but not yet finalized.
     * Limited editing allowed (approved amounts/dates).
     */
    APPROVED("Document has been approved", false),

    /**
     * Document is finalized and immutable.
     * No modifications allowed. Only cancellation or credit note possible.
     * This status is required for fiscal compliance.
     */
    FINALIZED("Document is finalized and immutable", false),

    /**
     * Document has been canceled.
     * Creates audit trail of cancellation.
     */
    CANCELED("Document has been canceled", false);

    private final String description;
    private final boolean editable;

    DocumentFinalizationStatus(String description, boolean editable) {
        this.description = description;
        this.editable = editable;
    }

    /**
     * Check if this status allows document editing.
     *
     * @return true if document can be edited in this status, false otherwise
     */
    public boolean isEditable() {
        return editable;
    }

    /**
     * Check if a transition from current status to target status is allowed.
     *
     * Valid transitions:
     * - DRAFT -> PENDING_APPROVAL, DRAFT
     * - PENDING_APPROVAL -> APPROVED, DRAFT, PENDING_APPROVAL
     * - APPROVED -> FINALIZED, CANCELED
     * - FINALIZED -> CANCELED (cancellation only)
     * - CANCELED -> (no transitions)
     *
     * @param targetStatus The target status to transition to
     * @return true if transition is allowed, false otherwise
     */
    public boolean canTransitionTo(DocumentFinalizationStatus targetStatus) {
        if (this == targetStatus) {
            return true; // Can always stay in same status
        }

        return switch (this) {
            case DRAFT -> targetStatus == PENDING_APPROVAL;
            case PENDING_APPROVAL -> targetStatus == APPROVED || targetStatus == DRAFT;
            case APPROVED -> targetStatus == FINALIZED || targetStatus == CANCELED;
            case FINALIZED -> targetStatus == CANCELED; // Only cancellation after finalization
            case CANCELED -> false; // Canceled documents cannot transition
        };
    }

    public String getDescription() {
        return description;
    }
}
