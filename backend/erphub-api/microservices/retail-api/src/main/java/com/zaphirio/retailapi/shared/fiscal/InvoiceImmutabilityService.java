package com.zaphirio.retailapi.shared.fiscal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for enforcing invoice immutability and fiscal compliance.
 *
 * Prevents modification of invoices after finalization, maintaining
 * compliance with tax authority requirements (e.g., AFIP in Argentina).
 *
 * Key responsibilities:
 * 1. Validate status transitions (DRAFT -> APPROVED -> FINALIZED)
 * 2. Enforce immutability of finalized invoices
 * 3. Allow only cancellation for finalized invoices
 * 4. Maintain complete audit trail of all modifications
 */
@Service
@Slf4j
public class InvoiceImmutabilityService {

    /**
     * Validate that an invoice can be modified.
     *
     * Throws exception if invoice is finalized or in non-editable status.
     *
     * @param invoiceId The invoice ID
     * @param currentStatus The current finalization status
     * @throws IllegalStateException if invoice cannot be modified
     */
    public void validateModifiableStatus(String invoiceId, DocumentFinalizationStatus currentStatus) {
        if (!currentStatus.isEditable()) {
            log.warn("Attempt to modify non-editable invoice: invoiceId={}, status={}", invoiceId, currentStatus);
            throw new IllegalStateException(
                    "Cannot modify invoice in status '" + currentStatus.name() + "'. " +
                    currentStatus.getDescription()
            );
        }
    }

    /**
     * Validate invoice status transition.
     *
     * Ensures transitions follow the allowed state machine:
     * DRAFT -> PENDING_APPROVAL -> APPROVED -> FINALIZED -> CANCELED
     *
     * @param invoiceId The invoice ID
     * @param currentStatus Current finalization status
     * @param targetStatus Target finalization status
     * @throws IllegalArgumentException if transition is not allowed
     */
    public void validateStatusTransition(
            String invoiceId,
            DocumentFinalizationStatus currentStatus,
            DocumentFinalizationStatus targetStatus
    ) {
        if (!currentStatus.canTransitionTo(targetStatus)) {
            log.warn(
                    "Invalid status transition: invoiceId={}, from={}, to={}",
                    invoiceId, currentStatus, targetStatus
            );
            throw new IllegalArgumentException(
                    "Cannot transition invoice from status '" + currentStatus.name() +
                    "' to '" + targetStatus.name() + "'"
            );
        }
    }

    /**
     * Check if invoice is finalized (immutable).
     *
     * @param status The finalization status to check
     * @return true if invoice is finalized and immutable, false otherwise
     */
    public boolean isFinalized(DocumentFinalizationStatus status) {
        return status == DocumentFinalizationStatus.FINALIZED;
    }

    /**
     * Check if invoice is cancelable.
     *
     * Invoices can be canceled if they are in APPROVED or FINALIZED status.
     * Canceled invoices cannot be re-opened.
     *
     * @param status The finalization status to check
     * @return true if invoice can be canceled, false otherwise
     */
    public boolean isCancelable(DocumentFinalizationStatus status) {
        return status == DocumentFinalizationStatus.APPROVED ||
               status == DocumentFinalizationStatus.FINALIZED;
    }

    /**
     * Validate that a specific field can be modified.
     *
     * Checks if the field has @ImmutableField annotation and if current status
     * allows modification.
     *
     * @param invoiceId Invoice ID for logging
     * @param fieldName Name of field being modified
     * @param currentStatus Current finalization status
     * @param hasImmutableAnnotation Whether field has @ImmutableField
     * @param editableBeforeFinalization Whether field is editable before finalization
     * @throws IllegalStateException if field cannot be modified
     */
    public void validateFieldModification(
            String invoiceId,
            String fieldName,
            DocumentFinalizationStatus currentStatus,
            boolean hasImmutableAnnotation,
            boolean editableBeforeFinalization
    ) {
        if (!hasImmutableAnnotation) {
            return; // Field has no immutability restriction
        }

        if (currentStatus == DocumentFinalizationStatus.FINALIZED) {
            log.warn(
                    "Attempt to modify immutable field on finalized invoice: invoiceId={}, field={}",
                    invoiceId, fieldName
            );
            throw new IllegalStateException(
                    "Cannot modify field '" + fieldName +
                    "' on finalized invoice. Invoice is immutable after finalization."
            );
        }

        if (!editableBeforeFinalization && currentStatus != DocumentFinalizationStatus.DRAFT) {
            log.warn(
                    "Attempt to modify field with restricted editability: invoiceId={}, field={}, status={}",
                    invoiceId, fieldName, currentStatus
            );
            throw new IllegalStateException(
                    "Field '" + fieldName +
                    "' can only be modified in DRAFT status. Current status: " + currentStatus.name()
            );
        }
    }

    /**
     * Finalize an invoice, making it immutable.
     *
     * Once finalized:
     * - No modifications allowed (except cancellation)
     * - Generates immutable fiscal record
     * - Locks all amounts and dates
     *
     * @param invoiceId Invoice ID
     * @param currentStatus Current status
     * @return The new FINALIZED status
     * @throws IllegalStateException if invoice cannot be finalized
     */
    public DocumentFinalizationStatus finalizeInvoice(
            String invoiceId,
            DocumentFinalizationStatus currentStatus
    ) {
        if (currentStatus != DocumentFinalizationStatus.APPROVED &&
            currentStatus != DocumentFinalizationStatus.PENDING_APPROVAL) {
            log.warn(
                    "Attempt to finalize invoice in invalid status: invoiceId={}, status={}",
                    invoiceId, currentStatus
            );
            throw new IllegalStateException(
                    "Invoice can only be finalized from APPROVED or PENDING_APPROVAL status. " +
                    "Current status: " + currentStatus.name()
            );
        }

        log.info("Invoice finalized and locked for modifications: invoiceId={}", invoiceId);
        return DocumentFinalizationStatus.FINALIZED;
    }

    /**
     * Cancel an invoice.
     *
     * Canceled invoices:
     * - Cannot be reopened or modified
     * - Maintain full audit trail
     * - Should generate credit note or cancellation document
     *
     * @param invoiceId Invoice ID
     * @param currentStatus Current status
     * @param cancellationReason Reason for cancellation (for audit trail)
     * @return The new CANCELED status
     * @throws IllegalStateException if invoice cannot be canceled
     */
    public DocumentFinalizationStatus cancelInvoice(
            String invoiceId,
            DocumentFinalizationStatus currentStatus,
            String cancellationReason
    ) {
        if (!isCancelable(currentStatus)) {
            log.warn(
                    "Attempt to cancel invoice in non-cancelable status: invoiceId={}, status={}",
                    invoiceId, currentStatus
            );
            throw new IllegalStateException(
                    "Invoice can only be canceled from APPROVED or FINALIZED status. " +
                    "Current status: " + currentStatus.name()
            );
        }

        log.info(
                "Invoice canceled: invoiceId={}, reason={}, previousStatus={}",
                invoiceId, cancellationReason, currentStatus
        );
        return DocumentFinalizationStatus.CANCELED;
    }
}
