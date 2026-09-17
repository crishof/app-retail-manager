package com.zaphirio.retailapi.shared.fiscal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for InvoiceImmutabilityService.
 *
 * Tests state machine transitions, editability checks, and immutability enforcement.
 */
@DisplayName("InvoiceImmutabilityService Tests")
class InvoiceImmutabilityServiceTest {

    private InvoiceImmutabilityService invoiceImmutabilityService;
    private static final String TEST_INVOICE_ID = "invoice-123";

    @BeforeEach
    void setUp() {
        invoiceImmutabilityService = new InvoiceImmutabilityService();
    }

    // ========================
    // Status Editability Tests
    // ========================

    @Test
    @DisplayName("DRAFT status should be editable")
    void testDraftStatusIsEditable() {
        assertTrue(DocumentFinalizationStatus.DRAFT.isEditable(),
                "DRAFT status should be editable");
    }

    @Test
    @DisplayName("PENDING_APPROVAL status should be editable")
    void testPendingApprovalStatusIsEditable() {
        assertTrue(DocumentFinalizationStatus.PENDING_APPROVAL.isEditable(),
                "PENDING_APPROVAL status should be editable");
    }

    @Test
    @DisplayName("APPROVED status should not be editable")
    void testApprovedStatusIsNotEditable() {
        assertFalse(DocumentFinalizationStatus.APPROVED.isEditable(),
                "APPROVED status should not be editable");
    }

    @Test
    @DisplayName("FINALIZED status should not be editable")
    void testFinalizedStatusIsNotEditable() {
        assertFalse(DocumentFinalizationStatus.FINALIZED.isEditable(),
                "FINALIZED status should not be editable");
    }

    @Test
    @DisplayName("CANCELED status should not be editable")
    void testCanceledStatusIsNotEditable() {
        assertFalse(DocumentFinalizationStatus.CANCELED.isEditable(),
                "CANCELED status should not be editable");
    }

    // ========================
    // Modifiable Status Validation Tests
    // ========================

    @Test
    @DisplayName("validateModifiableStatus should pass for DRAFT")
    void testValidateModifiableStatusDraft() {
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateModifiableStatus(
                TEST_INVOICE_ID, DocumentFinalizationStatus.DRAFT));
    }

    @Test
    @DisplayName("validateModifiableStatus should pass for PENDING_APPROVAL")
    void testValidateModifiableStatusPendingApproval() {
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateModifiableStatus(
                TEST_INVOICE_ID, DocumentFinalizationStatus.PENDING_APPROVAL));
    }

    @Test
    @DisplayName("validateModifiableStatus should fail for APPROVED")
    void testValidateModifiableStatusApproved() {
        assertThrows(IllegalStateException.class,
                () -> invoiceImmutabilityService.validateModifiableStatus(
                        TEST_INVOICE_ID, DocumentFinalizationStatus.APPROVED),
                "Should throw exception for non-editable APPROVED status");
    }

    @Test
    @DisplayName("validateModifiableStatus should fail for FINALIZED")
    void testValidateModifiableStatusFinalized() {
        assertThrows(IllegalStateException.class,
                () -> invoiceImmutabilityService.validateModifiableStatus(
                        TEST_INVOICE_ID, DocumentFinalizationStatus.FINALIZED),
                "Should throw exception for immutable FINALIZED status");
    }

    @Test
    @DisplayName("validateModifiableStatus should fail for CANCELED")
    void testValidateModifiableStatusCanceled() {
        assertThrows(IllegalStateException.class,
                () -> invoiceImmutabilityService.validateModifiableStatus(
                        TEST_INVOICE_ID, DocumentFinalizationStatus.CANCELED),
                "Should throw exception for non-editable CANCELED status");
    }

    // ========================
    // State Transition Tests
    // ========================

    @Test
    @DisplayName("DRAFT to PENDING_APPROVAL transition should be allowed")
    void testDraftToPendingApprovalTransition() {
        assertTrue(DocumentFinalizationStatus.DRAFT.canTransitionTo(DocumentFinalizationStatus.PENDING_APPROVAL),
                "DRAFT to PENDING_APPROVAL should be allowed");
    }

    @Test
    @DisplayName("DRAFT to DRAFT transition should be allowed")
    void testDraftToDraftTransition() {
        assertTrue(DocumentFinalizationStatus.DRAFT.canTransitionTo(DocumentFinalizationStatus.DRAFT),
                "DRAFT to DRAFT should be allowed (same state)");
    }

    @Test
    @DisplayName("DRAFT to APPROVED transition should not be allowed")
    void testDraftToApprovedTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.DRAFT.canTransitionTo(DocumentFinalizationStatus.APPROVED),
                "DRAFT to APPROVED should not be allowed (skip PENDING_APPROVAL)");
    }

    @Test
    @DisplayName("PENDING_APPROVAL to APPROVED transition should be allowed")
    void testPendingApprovalToApprovedTransition() {
        assertTrue(DocumentFinalizationStatus.PENDING_APPROVAL.canTransitionTo(DocumentFinalizationStatus.APPROVED),
                "PENDING_APPROVAL to APPROVED should be allowed");
    }

    @Test
    @DisplayName("PENDING_APPROVAL to DRAFT transition should be allowed")
    void testPendingApprovalToDraftTransition() {
        assertTrue(DocumentFinalizationStatus.PENDING_APPROVAL.canTransitionTo(DocumentFinalizationStatus.DRAFT),
                "PENDING_APPROVAL to DRAFT should be allowed (back to draft)");
    }

    @Test
    @DisplayName("PENDING_APPROVAL to FINALIZED transition should not be allowed")
    void testPendingApprovalToFinalizedTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.PENDING_APPROVAL.canTransitionTo(DocumentFinalizationStatus.FINALIZED),
                "PENDING_APPROVAL to FINALIZED should not be allowed (skip APPROVED)");
    }

    @Test
    @DisplayName("APPROVED to FINALIZED transition should be allowed")
    void testApprovedToFinalizedTransition() {
        assertTrue(DocumentFinalizationStatus.APPROVED.canTransitionTo(DocumentFinalizationStatus.FINALIZED),
                "APPROVED to FINALIZED should be allowed");
    }

    @Test
    @DisplayName("APPROVED to CANCELED transition should be allowed")
    void testApprovedToCanceledTransition() {
        assertTrue(DocumentFinalizationStatus.APPROVED.canTransitionTo(DocumentFinalizationStatus.CANCELED),
                "APPROVED to CANCELED should be allowed");
    }

    @Test
    @DisplayName("APPROVED to DRAFT transition should not be allowed")
    void testApprovedToDraftTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.APPROVED.canTransitionTo(DocumentFinalizationStatus.DRAFT),
                "APPROVED to DRAFT should not be allowed (cannot go back)");
    }

    @Test
    @DisplayName("FINALIZED to CANCELED transition should be allowed")
    void testFinalizedToCanceledTransition() {
        assertTrue(DocumentFinalizationStatus.FINALIZED.canTransitionTo(DocumentFinalizationStatus.CANCELED),
                "FINALIZED to CANCELED should be allowed (only option)");
    }

    @Test
    @DisplayName("FINALIZED to DRAFT transition should not be allowed")
    void testFinalizedToDraftTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.FINALIZED.canTransitionTo(DocumentFinalizationStatus.DRAFT),
                "FINALIZED to DRAFT should not be allowed (cannot modify)");
    }

    @Test
    @DisplayName("FINALIZED to APPROVED transition should not be allowed")
    void testFinalizedToApprovedTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.FINALIZED.canTransitionTo(DocumentFinalizationStatus.APPROVED),
                "FINALIZED to APPROVED should not be allowed");
    }

    @Test
    @DisplayName("CANCELED to any status should not be allowed")
    void testCanceledToAnyTransitionNotAllowed() {
        assertFalse(DocumentFinalizationStatus.CANCELED.canTransitionTo(DocumentFinalizationStatus.DRAFT),
                "CANCELED to DRAFT should not be allowed");
        assertFalse(DocumentFinalizationStatus.CANCELED.canTransitionTo(DocumentFinalizationStatus.PENDING_APPROVAL),
                "CANCELED to PENDING_APPROVAL should not be allowed");
        assertFalse(DocumentFinalizationStatus.CANCELED.canTransitionTo(DocumentFinalizationStatus.APPROVED),
                "CANCELED to APPROVED should not be allowed");
        assertFalse(DocumentFinalizationStatus.CANCELED.canTransitionTo(DocumentFinalizationStatus.FINALIZED),
                "CANCELED to FINALIZED should not be allowed");
    }

    // ========================
    // validateStatusTransition Tests
    // ========================

    @Test
    @DisplayName("validateStatusTransition should pass for allowed transition")
    void testValidateStatusTransitionAllowed() {
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateStatusTransition(
                TEST_INVOICE_ID,
                DocumentFinalizationStatus.DRAFT,
                DocumentFinalizationStatus.PENDING_APPROVAL));
    }

    @Test
    @DisplayName("validateStatusTransition should fail for disallowed transition")
    void testValidateStatusTransitionDisallowed() {
        assertThrows(IllegalArgumentException.class,
                () -> invoiceImmutabilityService.validateStatusTransition(
                        TEST_INVOICE_ID,
                        DocumentFinalizationStatus.DRAFT,
                        DocumentFinalizationStatus.APPROVED),
                "Should throw exception for disallowed transition");
    }

    // ========================
    // isFinalized Tests
    // ========================

    @Test
    @DisplayName("isFinalized should return true for FINALIZED status")
    void testIsFinalizedTrue() {
        assertTrue(invoiceImmutabilityService.isFinalized(DocumentFinalizationStatus.FINALIZED),
                "FINALIZED status should return true");
    }

    @Test
    @DisplayName("isFinalized should return false for DRAFT status")
    void testIsFinalizedFalseDraft() {
        assertFalse(invoiceImmutabilityService.isFinalized(DocumentFinalizationStatus.DRAFT),
                "DRAFT status should return false");
    }

    @Test
    @DisplayName("isFinalized should return false for APPROVED status")
    void testIsFinalizedFalseApproved() {
        assertFalse(invoiceImmutabilityService.isFinalized(DocumentFinalizationStatus.APPROVED),
                "APPROVED status should return false");
    }

    @Test
    @DisplayName("isFinalized should return false for CANCELED status")
    void testIsFinalizedFalseCanceled() {
        assertFalse(invoiceImmutabilityService.isFinalized(DocumentFinalizationStatus.CANCELED),
                "CANCELED status should return false for finalized check");
    }

    // ========================
    // isCancelable Tests
    // ========================

    @Test
    @DisplayName("isCancelable should return true for APPROVED status")
    void testIsCancelableApproved() {
        assertTrue(invoiceImmutabilityService.isCancelable(DocumentFinalizationStatus.APPROVED),
                "APPROVED status should be cancelable");
    }

    @Test
    @DisplayName("isCancelable should return true for FINALIZED status")
    void testIsCancelableFinalized() {
        assertTrue(invoiceImmutabilityService.isCancelable(DocumentFinalizationStatus.FINALIZED),
                "FINALIZED status should be cancelable");
    }

    @Test
    @DisplayName("isCancelable should return false for DRAFT status")
    void testIsCancelableFalseDraft() {
        assertFalse(invoiceImmutabilityService.isCancelable(DocumentFinalizationStatus.DRAFT),
                "DRAFT status should not be cancelable");
    }

    @Test
    @DisplayName("isCancelable should return false for PENDING_APPROVAL status")
    void testIsCancelableFalsePendingApproval() {
        assertFalse(invoiceImmutabilityService.isCancelable(DocumentFinalizationStatus.PENDING_APPROVAL),
                "PENDING_APPROVAL status should not be cancelable");
    }

    @Test
    @DisplayName("isCancelable should return false for CANCELED status")
    void testIsCancelableFalseCanceled() {
        assertFalse(invoiceImmutabilityService.isCancelable(DocumentFinalizationStatus.CANCELED),
                "Already CANCELED status should not be cancelable");
    }

    // ========================
    // State Machine Completeness Tests
    // ========================

    @Test
    @DisplayName("Complete valid workflow: DRAFT -> PENDING_APPROVAL -> APPROVED -> FINALIZED")
    void testCompleteValidWorkflow() {
        String invoiceId = "invoice-workflow-test";
        DocumentFinalizationStatus status1 = DocumentFinalizationStatus.DRAFT;
        DocumentFinalizationStatus status2 = DocumentFinalizationStatus.PENDING_APPROVAL;
        DocumentFinalizationStatus status3 = DocumentFinalizationStatus.APPROVED;
        DocumentFinalizationStatus status4 = DocumentFinalizationStatus.FINALIZED;

        // DRAFT -> PENDING_APPROVAL
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateStatusTransition(
                invoiceId, status1, status2));

        // PENDING_APPROVAL -> APPROVED
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateStatusTransition(
                invoiceId, status2, status3));

        // APPROVED -> FINALIZED
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateStatusTransition(
                invoiceId, status3, status4));

        // Verify finalized
        assertTrue(invoiceImmutabilityService.isFinalized(status4),
                "Should be finalized after complete workflow");
    }

    @Test
    @DisplayName("Complete valid workflow with cancellation: DRAFT -> PENDING_APPROVAL -> APPROVED -> CANCELED")
    void testCompleteValidWorkflowWithCancellation() {
        String invoiceId = "invoice-cancellation-test";
        DocumentFinalizationStatus status1 = DocumentFinalizationStatus.DRAFT;
        DocumentFinalizationStatus status2 = DocumentFinalizationStatus.PENDING_APPROVAL;
        DocumentFinalizationStatus status3 = DocumentFinalizationStatus.APPROVED;
        DocumentFinalizationStatus status4 = DocumentFinalizationStatus.CANCELED;

        // DRAFT -> PENDING_APPROVAL
        // (status transition already validated earlier)

        // PENDING_APPROVAL -> APPROVED
        // (status transition already validated earlier)

        // APPROVED -> CANCELED (cancelable)
        assertTrue(invoiceImmutabilityService.isCancelable(status3),
                "APPROVED status should be cancelable");
        assertDoesNotThrow(() -> invoiceImmutabilityService.validateStatusTransition(
                invoiceId, status3, status4));
    }

}
