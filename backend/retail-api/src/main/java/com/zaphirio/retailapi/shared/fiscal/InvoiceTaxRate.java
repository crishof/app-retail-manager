package com.zaphirio.retailapi.shared.fiscal;

import java.math.BigDecimal;

/**
 * Spanish VAT (IVA - Impuesto sobre el Valor Añadido) tax rates.
 * Spain uses standard, reduced, and zero rates.
 *
 * Standard: 21% (most goods and services)
 * Reduced: 7% (basic goods, some services)
 * Zero: 0% (exports, specific exemptions)
 */
public enum InvoiceTaxRate {

    /**
     * Standard VAT rate: 21%
     * Applied to most goods and services in Spain.
     */
    STANDARD("21%", new BigDecimal("21.00"), "Standard VAT rate"),

    /**
     * Reduced VAT rate: 7%
     * Applied to basic goods (food, books, certain services).
     */
    REDUCED("7%", new BigDecimal("7.00"), "Reduced VAT rate"),

    /**
     * Zero VAT rate: 0%
     * Applied to exports and specific exemptions.
     */
    ZERO("0%", BigDecimal.ZERO, "Zero VAT rate (exempted)");

    private final String displayRate;
    private final BigDecimal percentage;
    private final String description;

    InvoiceTaxRate(String displayRate, BigDecimal percentage, String description) {
        this.displayRate = displayRate;
        this.percentage = percentage;
        this.description = description;
    }

    public String getDisplayRate() {
        return displayRate;
    }

    public BigDecimal getPercentage() {
        return percentage;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Get the decimal multiplier for tax calculation.
     * E.g., for 21% rate, returns 0.21 (used to calculate tax from base amount).
     *
     * @return tax rate as decimal (0.21 for 21%, 0.07 for 7%, 0 for 0%)
     */
    public BigDecimal getDecimalMultiplier() {
        return percentage.divide(new BigDecimal("100"));
    }

    /**
     * Get the multiplier for gross amount calculation.
     * E.g., for 21% rate, returns 1.21 (base amount * 1.21 = gross with tax).
     *
     * @return gross multiplier (1.21 for 21%, 1.07 for 7%, 1.00 for 0%)
     */
    public BigDecimal getGrossMultiplier() {
        return BigDecimal.ONE.add(getDecimalMultiplier());
    }

    /**
     * Find tax rate by percentage value.
     *
     * @param percentageValue the percentage (e.g., "21", "7", "0")
     * @return the matching InvoiceTaxRate, or null if not found
     */
    public static InvoiceTaxRate fromPercentage(String percentageValue) {
        return switch (percentageValue) {
            case "21", "21.00" -> STANDARD;
            case "7", "7.00" -> REDUCED;
            case "0", "0.00" -> ZERO;
            default -> null;
        };
    }

    /**
     * Find tax rate by percentage as BigDecimal.
     *
     * @param percentage the percentage value
     * @return the matching InvoiceTaxRate, or null if not found
     */
    public static InvoiceTaxRate fromPercentage(BigDecimal percentage) {
        return switch (percentage.toPlainString()) {
            case "21", "21.00" -> STANDARD;
            case "7", "7.00" -> REDUCED;
            case "0", "0.00" -> ZERO;
            default -> null;
        };
    }
}
