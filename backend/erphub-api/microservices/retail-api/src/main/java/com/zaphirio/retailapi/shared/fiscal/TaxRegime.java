package com.zaphirio.retailapi.shared.fiscal;

/**
 * Argentine tax regimes for fiscal compliance.
 *
 * Define applicable tax treatment under AFIP regulations.
 * Used to determine VAT rates, withholding obligations, and reporting requirements.
 */
public enum TaxRegime {

    /**
     * Responsable Inscripto (Registered Taxpayer).
     * Must issue invoices with VAT breakdown.
     * Can claim input VAT deduction.
     * Quarterly VAT reporting mandatory.
     */
    IVA_RESPONSABLE(
            "IVA Responsable Inscripto",
            true,
            true,
            new double[]{0, 10.5, 21, 27}
    ),

    /**
     * Monotributista (Single Taxpayer - Small Business).
     * Simplified tax regime.
     * Cannot claim input VAT.
     * Fixed monthly tax payment.
     */
    MONOTRIBUTISTA(
            "Monotributista",
            false,
            false,
            new double[]{0}
    ),

    /**
     * No Inscripto (Unregistered).
     * Must charge 21% VAT to end consumers.
     * Cannot issue tax invoices.
     */
    NO_INSCRIPTO(
            "No Inscripto",
            false,
            false,
            new double[]{21}
    ),

    /**
     * Pequeño Contribuyente (Small Taxpayer).
     * Limited VAT regime.
     */
    PEQUEÑO_CONTRIBUYENTE(
            "Pequeño Contribuyente",
            true,
            false,
            new double[]{0, 21}
    ),

    /**
     * Exento (Exempt).
     * No VAT obligation.
     */
    EXENTO(
            "Exento",
            false,
            false,
            new double[]{0}
    );

    private final String description;
    private final boolean issuesTaxInvoices;
    private final boolean canClaimInputVAT;
    private final double[] applicableVATRates;

    TaxRegime(String description, boolean issuesTaxInvoices, boolean canClaimInputVAT, double[] applicableVATRates) {
        this.description = description;
        this.issuesTaxInvoices = issuesTaxInvoices;
        this.canClaimInputVAT = canClaimInputVAT;
        this.applicableVATRates = applicableVATRates;
    }

    public String getDescription() {
        return description;
    }

    public boolean issuesTaxInvoices() {
        return issuesTaxInvoices;
    }

    public boolean canClaimInputVAT() {
        return canClaimInputVAT;
    }

    public double[] getApplicableVATRates() {
        return applicableVATRates;
    }

    /**
     * Check if a specific VAT rate is applicable for this regime.
     *
     * @param vatRate The VAT rate to check (e.g., 0, 10.5, 21, 27)
     * @return true if rate is applicable, false otherwise
     */
    public boolean isVATRateApplicable(double vatRate) {
        for (double rate : applicableVATRates) {
            if (rate == vatRate) {
                return true;
            }
        }
        return false;
    }
}
