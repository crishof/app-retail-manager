package com.zaphirio.retailapi.shared.fiscal;

/**
 * Exception thrown when tax compliance validation fails.
 *
 * Used to enforce fiscal compliance requirements before invoice finalization.
 * Includes details about which validation failed and remediation steps.
 *
 * Examples:
 * - Invalid CUIT format or checksum
 * - Invalid invoice number sequence
 * - VAT rate not applicable for tax regime
 * - VAT calculation mismatch
 * - Total amount validation failure
 * - Missing required tax compliance fields
 */
public class TaxComplianceException extends RuntimeException {

    private final String validationField;
    private final String expectedValue;
    private final String actualValue;

    /**
     * Create a tax compliance exception with validation details.
     *
     * @param message Description of the validation failure
     * @param validationField The field that failed validation (e.g., "CUIT", "invoiceNumber")
     * @param expectedValue Expected value or format
     * @param actualValue Actual value that failed
     */
    public TaxComplianceException(String message, String validationField, String expectedValue, String actualValue) {
        super(message);
        this.validationField = validationField;
        this.expectedValue = expectedValue;
        this.actualValue = actualValue;
    }

    /**
     * Create a tax compliance exception with message only.
     *
     * @param message Description of the validation failure
     */
    public TaxComplianceException(String message) {
        super(message);
        this.validationField = null;
        this.expectedValue = null;
        this.actualValue = null;
    }

    /**
     * Create a tax compliance exception with message and cause.
     *
     * @param message Description of the validation failure
     * @param cause Root cause exception
     */
    public TaxComplianceException(String message, Throwable cause) {
        super(message, cause);
        this.validationField = null;
        this.expectedValue = null;
        this.actualValue = null;
    }

    public String getValidationField() {
        return validationField;
    }

    public String getExpectedValue() {
        return expectedValue;
    }

    public String getActualValue() {
        return actualValue;
    }

    @Override
    public String toString() {
        if (validationField != null) {
            return String.format(
                    "TaxComplianceException [%s]: %s (expected: %s, actual: %s)",
                    validationField, getMessage(), expectedValue, actualValue
            );
        }
        return "TaxComplianceException: " + getMessage();
    }

}
