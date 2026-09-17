package com.zaphirio.retailapi.shared.fiscal;

import java.lang.annotation.*;

/**
 * Annotation to trigger tax compliance validation when an invoice is finalized.
 *
 * Applies to Invoice entity fields to mark them as requiring tax compliance checks
 * before the document can transition to FINALIZED status.
 *
 * Validation flow:
 * 1. CUIT validation (if supplier present)
 * 2. Invoice number format validation
 * 3. VAT rate validation against tax regime
 * 4. VAT calculation verification
 * 5. Total amount validation
 * 6. Sequential numbering check
 *
 * This annotation is processed by InvoiceFinalizationService which calls
 * TaxComplianceService.validateInvoiceCompliance() before transitioning to FINALIZED.
 *
 * Example usage:
 *
 * @TaxComplianceValidator
 * public Invoice finalizeInvoice(Invoice invoice) {
 *     // Validation happens automatically during finalization
 *     return invoiceService.finalizeInvoice(invoice);
 * }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface TaxComplianceValidator {

    /**
     * Enable/disable validation.
     * Default true (validation enabled).
     */
    boolean enabled() default true;

    /**
     * Fail on validation error.
     * If true, throws TaxComplianceException on any validation failure.
     * If false, logs warning but allows finalization (not recommended).
     */
    boolean failOnError() default true;

    /**
     * Description of the validation purpose.
     */
    String description() default "Validate invoice tax compliance before finalization";

}
