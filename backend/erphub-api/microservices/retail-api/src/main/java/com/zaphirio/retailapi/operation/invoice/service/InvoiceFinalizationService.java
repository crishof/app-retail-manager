package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.model.Invoice;
import com.zaphirio.retailapi.operation.invoice.repository.InvoiceRepository;
import com.zaphirio.retailapi.shared.audit.AuditService;
import com.zaphirio.retailapi.shared.audit.DocumentVersioningService;
import com.zaphirio.retailapi.shared.fiscal.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service to finalize invoices with tax compliance validation.
 *
 * Orchestrates the invoice finalization workflow:
 * 1. Validate tax compliance (CUIT, invoice number, VAT rates, calculations)
 * 2. Create document version snapshot (before finalization)
 * 3. Update invoice status to FINALIZED
 * 4. Record finalization in audit trail
 * 5. Lock the document version as finalized
 *
 * Once finalized, invoices become immutable and cannot be modified.
 * Only cancellation or credit note creation is allowed.
 *
 * This service requires:
 * - TaxComplianceService for validation
 * - InvoiceImmutabilityService for status transitions
 * - DocumentVersioningService for snapshot creation
 * - AuditService for audit trail recording
 */
@Slf4j
@Service
@Transactional
public class InvoiceFinalizationService {

    private final TaxComplianceService taxComplianceService;
    private final InvoiceImmutabilityService invoiceImmutabilityService;
    private final DocumentVersioningService documentVersioningService;
    private final AuditService auditService;
    private final InvoiceRepository invoiceRepository;

    public InvoiceFinalizationService(
            TaxComplianceService taxComplianceService,
            InvoiceImmutabilityService invoiceImmutabilityService,
            DocumentVersioningService documentVersioningService,
            AuditService auditService,
            InvoiceRepository invoiceRepository
    ) {
        this.taxComplianceService = taxComplianceService;
        this.invoiceImmutabilityService = invoiceImmutabilityService;
        this.documentVersioningService = documentVersioningService;
        this.auditService = auditService;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Finalize an invoice with full tax compliance validation and audit trail.
     *
     * Workflow:
     * 1. Validate current status (must be APPROVED to finalize)
     * 2. Perform tax compliance validation (@TaxComplianceValidator)
     * 3. Create immutable document version snapshot
     * 4. Update invoice status to FINALIZED
     * 5. Record finalization event in audit trail
     * 6. Lock document version as finalized
     *
     * @param invoice Invoice to finalize (must be in APPROVED status)
     * @param userId User ID performing the finalization (for audit trail)
     * @return Finalized invoice
     * @throws TaxComplianceException if tax validation fails
     * @throws IllegalStateException if invoice cannot transition to FINALIZED
     */
    @TaxComplianceValidator(
            enabled = true,
            failOnError = true,
            description = "Validate invoice tax compliance before finalization"
    )
    public Invoice finalizeInvoice(Invoice invoice, UUID userId) {
        log.info("Finalizing invoice {} with tax compliance validation", invoice.getId());

        // Step 1: Validate current status
        invoiceImmutabilityService.validateStatusTransition(
                invoice.getId().toString(),
                invoice.getFinalizationStatus(),
                DocumentFinalizationStatus.FINALIZED
        );

        // Step 2: Perform tax compliance validation
        try {
            taxComplianceService.validateInvoiceCompliance(invoice);
            log.info("Tax compliance validation passed for invoice {}", invoice.getId());
        } catch (TaxComplianceException e) {
            log.error("Tax compliance validation failed for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("error", e.getMessage());
            errorDetails.put("field", e.getValidationField());
            auditService.logCreate(
                    "INVOICE",
                    invoice.getId().toString(),
                    errorDetails,
                    String.format("Finalization failed: %s", e.getMessage())
            );
            throw e;
        }

        // Step 3: Create immutable document version snapshot
        try {
            Map<String, Object> invoiceSnapshot = objectMapperToMap(invoice);
            documentVersioningService.createVersion(
                    "INVOICE",
                    invoice.getId().toString(),
                    invoiceSnapshot,
                    "Pre-finalization snapshot for fiscal compliance"
            );
            log.info("Document version snapshot created for invoice {}", invoice.getId());
        } catch (Exception e) {
            log.error("Failed to create document version for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("error", e.getMessage());
            auditService.logCreate(
                    "INVOICE",
                    invoice.getId().toString(),
                    errorDetails,
                    String.format("Version snapshot failed: %s", e.getMessage())
            );
            throw new RuntimeException("Failed to create immutable version snapshot", e);
        }

        // Step 4: Update invoice status to FINALIZED
        invoice.setFinalizationStatus(DocumentFinalizationStatus.FINALIZED);
        invoice.setFinalizedAt(Instant.now());
        invoice.setFinalizedByUserId(userId);

        Invoice finalizedInvoice = invoiceRepository.save(invoice);
        log.info("Invoice {} finalized successfully at {}", invoice.getId(), invoice.getFinalizedAt());

        // Step 5: Record finalization event in audit trail
        Map<String, Object> finalizationDetails = new HashMap<>();
        finalizationDetails.put("invoiceNumber", invoice.getInvoiceNumber());
        finalizationDetails.put("invoiceDate", invoice.getInvoiceDate());
        finalizationDetails.put("finalizedAt", invoice.getFinalizedAt());
        finalizationDetails.put("totalPrice", invoice.getTotalPrice());

        auditService.logCreate(
                "INVOICE",
                invoice.getId().toString(),
                finalizationDetails,
                "Invoice finalized: " + invoice.getInvoiceNumber()
        );

        // Step 6: Lock document version as finalized
        try {
            Map<String, Object> finalSnapshot = objectMapperToMap(finalizedInvoice);
            documentVersioningService.finalizeDocument(
                    "INVOICE",
                    invoice.getId().toString(),
                    finalSnapshot
            );
            log.info("Document version locked as finalized for invoice {}", invoice.getId());
        } catch (Exception e) {
            log.warn("Failed to lock document version as finalized for invoice {}: {}", invoice.getId(), e.getMessage());
            // Don't fail the finalization process if version locking fails, but log the issue
        }

        return finalizedInvoice;
    }

    /**
     * Cancel a finalized invoice (creates cancellation record in audit trail).
     *
     * Even finalized invoices can be canceled (not truly deleted), with full audit trail.
     * This is the only modification allowed on finalized invoices.
     *
     * @param invoice Invoice to cancel (must be FINALIZED)
     * @param cancellationReason Reason for cancellation
     * @param userId User ID performing the cancellation
     * @return Canceled invoice
     */
    public Invoice cancelInvoice(Invoice invoice, String cancellationReason, UUID userId) {
        log.info("Canceling invoice {} - Reason: {}", invoice.getId(), cancellationReason);

        invoice.setFinalizationStatus(DocumentFinalizationStatus.CANCELED);
        Invoice canceledInvoice = invoiceRepository.save(invoice);

        Map<String, Object> cancellationDetails = new HashMap<>();
        cancellationDetails.put("invoiceNumber", invoice.getInvoiceNumber());
        cancellationDetails.put("cancellationReason", cancellationReason);
        cancellationDetails.put("canceledAt", Instant.now());

        auditService.logCreate(
                "INVOICE",
                invoice.getId().toString(),
                cancellationDetails,
                "Invoice canceled: " + cancellationReason
        );

        log.info("Invoice {} canceled successfully", invoice.getId());
        return canceledInvoice;
    }

    /**
     * Convert Invoice object to Map for versioning.
     */
    private Map<String, Object> objectMapperToMap(Invoice invoice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", invoice.getId());
        map.put("invoiceNumber", invoice.getInvoiceNumber());
        map.put("invoiceDate", invoice.getInvoiceDate());
        map.put("totalPrice", invoice.getTotalPrice());
        map.put("taxRegime", invoice.getTaxRegime());
        map.put("finalizationStatus", invoice.getFinalizationStatus());
        return map;
    }

}
