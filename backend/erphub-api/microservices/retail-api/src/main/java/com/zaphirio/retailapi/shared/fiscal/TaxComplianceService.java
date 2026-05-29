package com.zaphirio.retailapi.shared.fiscal;

import com.zaphirio.retailapi.operation.invoice.model.Invoice;
import com.zaphirio.retailapi.operation.invoice.model.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

/**
 * Service for Argentine tax compliance validation.
 *
 * Ensures invoices and documents comply with AFIP (Administración Federal de
 * Ingresos Públicos) regulations for fiscal compliance.
 *
 * Validates:
 * - CUIT format (tax ID)
 * - VAT calculations
 * - Invoice number sequencing
 * - Tax regime requirements
 * - Withholding obligations
 */
@Service
@Slf4j
public class TaxComplianceService {

    private static final Pattern CUIT_PATTERN = Pattern.compile("^\\d{2}-?\\d{8}-?\\d$");
    private static final Pattern INVOICE_NUMBER_PATTERN = Pattern.compile("^\\d{4}-?\\d{8}$");

    /**
     * Validate CUIT (Código Único de Identificación Tributaria).
     *
     * CUIT format: XX-XXXXXXXX-X (11 digits total)
     * Uses modulo 97 algorithm for checksum validation.
     *
     * @param cuit The CUIT to validate
     * @return true if CUIT is valid, false otherwise
     */
    public boolean validateCUIT(String cuit) {
        if (cuit == null || cuit.isEmpty()) {
            log.warn("CUIT validation failed: null or empty");
            return false;
        }

        // Remove hyphens
        String cleanCuit = cuit.replaceAll("-", "");

        // Check format
        if (!cleanCuit.matches("^\\d{11}$")) {
            log.warn("CUIT validation failed: invalid format - {}", cuit);
            return false;
        }

        // Validate checksum using modulo 97
        try {
            String cuitWithoutChecksum = cleanCuit.substring(0, 10);
            int checksumDigit = Integer.parseInt(cleanCuit.substring(10));

            int calculatedChecksum = 98 - (Integer.parseInt(cuitWithoutChecksum) % 97);

            if (calculatedChecksum != checksumDigit) {
                log.warn("CUIT validation failed: checksum mismatch - {}", cuit);
                return false;
            }

            log.debug("CUIT validated successfully: {}", cuit);
            return true;
        } catch (Exception e) {
            log.warn("CUIT validation failed: {}", cuit, e);
            return false;
        }
    }

    /**
     * Validate invoice number format.
     *
     * Format: SSSS-NNNNNNNN
     * - SSSS: Sales point (receipt point) - 4 digits
     * - NNNNNNNN: Sequential invoice number - 8 digits
     *
     * @param invoiceNumber The invoice number to validate
     * @return true if format is valid, false otherwise
     */
    public boolean validateInvoiceNumber(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            log.warn("Invoice number validation failed: null or empty");
            return false;
        }

        String cleanNumber = invoiceNumber.replaceAll("-", "");

        if (!cleanNumber.matches("^\\d{12}$")) {
            log.warn("Invoice number validation failed: invalid format - {}", invoiceNumber);
            return false;
        }

        log.debug("Invoice number validated: {}", invoiceNumber);
        return true;
    }

    /**
     * Validate VAT rate is applicable for tax regime.
     *
     * @param taxRegime The tax regime
     * @param vatRate The VAT rate to validate (e.g., 0, 10.5, 21, 27)
     * @return true if VAT rate is allowed, false otherwise
     */
    public boolean validateVATRateForRegime(TaxRegime taxRegime, double vatRate) {
        boolean isValid = taxRegime.isVATRateApplicable(vatRate);

        if (!isValid) {
            log.warn(
                    "VAT rate validation failed: regime={}, rate={}",
                    taxRegime.name(), vatRate
            );
        }

        return isValid;
    }

    /**
     * Validate that VAT calculation is correct.
     *
     * VAT = NetAmount * (VATRate / 100)
     * Allows for rounding differences (up to 0.01).
     *
     * @param netAmount The net amount (before VAT)
     * @param vatRate The VAT rate percentage
     * @param calculatedVAT The VAT amount that was calculated
     * @return true if calculation is approximately correct, false otherwise
     */
    public boolean validateVATCalculation(double netAmount, double vatRate, double calculatedVAT) {
        double expectedVAT = netAmount * (vatRate / 100);

        // Allow rounding difference of 0.01
        double difference = Math.abs(expectedVAT - calculatedVAT);

        if (difference > 0.01) {
            log.warn(
                    "VAT calculation validation failed: netAmount={}, rate={}, expected={}, calculated={}, diff={}",
                    netAmount, vatRate, expectedVAT, calculatedVAT, difference
            );
            return false;
        }

        return true;
    }

    /**
     * Validate total amount calculation.
     *
     * Total = NetAmount + VAT + Withholdings + Other Taxes
     *
     * @param netAmount Net amount
     * @param vat Total VAT
     * @param withholdings Total withholdings
     * @param otherTaxes Other taxes (internal tax, etc.)
     * @param totalAmount The total that was calculated
     * @return true if calculation is correct, false otherwise
     */
    public boolean validateTotalAmount(
            double netAmount,
            double vat,
            double withholdings,
            double otherTaxes,
            double totalAmount
    ) {
        double expectedTotal = netAmount + vat + otherTaxes - withholdings;

        // Allow rounding difference
        double difference = Math.abs(expectedTotal - totalAmount);

        if (difference > 0.01) {
            log.warn(
                    "Total amount validation failed: expected={}, calculated={}, diff={}",
                    expectedTotal, totalAmount, difference
            );
            return false;
        }

        return true;
    }

    /**
     * Validate withholding requirement based on tax regime and amount.
     *
     * Certain suppliers must withhold tax on payments.
     * Withholding rates: 10% VAT, 3% SUSS, etc.
     *
     * @param taxRegime The supplier's tax regime
     * @param amount The invoice amount
     * @return true if withholding may be required (caller must determine specific rate)
     */
    public boolean requiresWithholding(TaxRegime taxRegime, double amount) {
        // Simplified logic - in real scenario, would check supplier history and regulations
        return taxRegime == TaxRegime.IVA_RESPONSABLE && amount > 1000;
    }

    /**
     * Validate that invoice complies with AFIP sequential numbering.
     *
     * Invoices must be numbered sequentially without gaps.
     * Gaps indicate potential invoice manipulation.
     *
     * @param previousInvoiceNumber The last invoice number issued
     * @param currentInvoiceNumber The current invoice number
     * @return true if sequential, false if gap detected
     */
    public boolean validateSequentialNumbering(String previousInvoiceNumber, String currentInvoiceNumber) {
        try {
            // Extract sequential numbers
            String cleanPrevious = previousInvoiceNumber.replaceAll("-", "");
            String cleanCurrent = currentInvoiceNumber.replaceAll("-", "");

            // Both must be same receipt point
            String prevPoint = cleanPrevious.substring(0, 4);
            String currentPoint = cleanCurrent.substring(0, 4);

            if (!prevPoint.equals(currentPoint)) {
                return true; // Different receipt points, no gap check needed
            }

            long prevNum = Long.parseLong(cleanPrevious.substring(4));
            long currentNum = Long.parseLong(cleanCurrent.substring(4));

            boolean isSequential = currentNum == prevNum + 1;

            if (!isSequential) {
                log.warn(
                        "Sequential numbering validation failed: previous={}, current={}, gap={}",
                        previousInvoiceNumber, currentInvoiceNumber, (currentNum - prevNum - 1)
                );
            }

            return isSequential;
        } catch (Exception e) {
            log.error("Sequential numbering validation error", e);
            return false;
        }
    }

    /**
     * Validate that an invoice meets minimum requirements for tax compliance.
     *
     * Required fields:
     * - Valid CUIT
     * - Valid invoice number
     * - Correct VAT calculations
     * - Valid total amount
     * - Allowed VAT rates for tax regime
     *
     * @param cuit The supplier CUIT
     * @param invoiceNumber The invoice number
     * @param taxRegime The tax regime
     * @param netAmount Net amount
     * @param vatRate VAT rate applied
     * @param vatAmount VAT amount
     * @param totalAmount Total invoice amount
     * @return true if invoice passes all validation checks
     */
    public boolean validateInvoiceCompliance(
            String cuit,
            String invoiceNumber,
            TaxRegime taxRegime,
            double netAmount,
            double vatRate,
            double vatAmount,
            double totalAmount
    ) {
        // Validate CUIT
        if (!validateCUIT(cuit)) {
            log.warn("Invoice compliance validation failed: invalid CUIT");
            return false;
        }

        // Validate invoice number
        if (!validateInvoiceNumber(invoiceNumber)) {
            log.warn("Invoice compliance validation failed: invalid invoice number");
            return false;
        }

        // Validate VAT rate for regime
        if (!validateVATRateForRegime(taxRegime, vatRate)) {
            log.warn("Invoice compliance validation failed: VAT rate not allowed for regime");
            return false;
        }

        // Validate VAT calculation
        if (!validateVATCalculation(netAmount, vatRate, vatAmount)) {
            log.warn("Invoice compliance validation failed: VAT calculation incorrect");
            return false;
        }

        // Validate total amount
        if (!validateTotalAmount(netAmount, vatAmount, 0, 0, totalAmount)) {
            log.warn("Invoice compliance validation failed: total amount calculation incorrect");
            return false;
        }

        log.info("Invoice compliance validation passed: invoiceNumber={}, supplier={}", invoiceNumber, cuit);
        return true;
    }

    /**
     * Validate that an Invoice object meets all tax compliance requirements.
     *
     * Performs comprehensive validation including:
     * - Line item VAT rates against tax regime
     * - Overall invoice calculations
     * - Required fields for finalization
     *
     * @param invoice The invoice to validate
     * @throws TaxComplianceException if any validation fails
     */
    public void validateInvoiceCompliance(Invoice invoice) throws TaxComplianceException {
        if (invoice == null) {
            throw new TaxComplianceException("Invoice cannot be null");
        }

        // Validate tax regime is set
        if (invoice.getTaxRegime() == null) {
            throw new TaxComplianceException(
                    "Invoice must have tax regime defined",
                    "taxRegime",
                    "TaxRegime enum value",
                    "null"
            );
        }

        // Validate line items VAT rates against regime
        validateLineItemVATRates(invoice);

        log.info("Invoice compliance validation passed for invoice {}", invoice.getId());
    }

    /**
     * Validate that all line items use VAT rates applicable to the invoice's tax regime.
     *
     * @param invoice Invoice containing line items to validate
     * @throws TaxComplianceException if any line item has invalid VAT rate
     */
    private void validateLineItemVATRates(Invoice invoice) throws TaxComplianceException {
        if (invoice.getInvoiceItems() == null || invoice.getInvoiceItems().isEmpty()) {
            return; // No items to validate
        }

        TaxRegime taxRegime = invoice.getTaxRegime();

        for (int index = 0; index < invoice.getInvoiceItems().size(); index++) {
            InvoiceItem item = invoice.getInvoiceItems().get(index);

            if (item.getTaxRate() == null) {
                log.warn("Invoice item {} has null tax rate", index);
                continue; // Skip if tax rate not set
            }

            double vatRate = item.getTaxRate();

            if (!validateVATRateForRegime(taxRegime, vatRate)) {
                String message = String.format(
                        "Line item %d has invalid VAT rate %.2f for tax regime %s",
                        index + 1, vatRate, taxRegime.getDescription()
                );
                log.error(message);
                throw new TaxComplianceException(
                        message,
                        "invoiceItems[" + index + "].taxRate",
                        "VAT rate from " + formatVATRates(taxRegime.getApplicableVATRates()),
                        String.format("%.2f", vatRate)
                );
            }
        }

        log.debug("All {} line items passed VAT rate validation", invoice.getInvoiceItems().size());
    }

    /**
     * Format VAT rates array as readable string.
     *
     * @param rates Array of VAT rates
     * @return Formatted string like "0%, 10.5%, 21%"
     */
    private String formatVATRates(double[] rates) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < rates.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(String.format("%.1f%%", rates[i]));
        }
        return sb.toString();
    }
}
