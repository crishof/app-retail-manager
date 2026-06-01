package com.zaphirio.retailapi.shared.fiscal;

/**
 * Spanish invoice document types (comprobantes).
 * Required for fiscal compliance in Spain (NOT Argentina AFIP types).
 *
 * Spain uses the following types:
 * - FACTURA: Standard invoice
 * - NOTA_CREDITO: Credit note (reduces customer debt)
 * - NOTA_DEBITO: Debit note (increases customer debt)
 * - RESGUARDO: Receipt (for immediate transactions)
 */
public enum InvoiceDocumentType {

    /**
     * Standard invoice (Factura).
     * Used for most sales and purchase transactions.
     * Applies to: Sales and Purchase
     */
    FACTURA("Factura", "Standard invoice", true, true),

    /**
     * Credit note (Nota de Crédito).
     * Reduces customer debt or supplier payment.
     * Commonly used for returns, discounts, or corrections.
     * Applies to: Sales and Purchase
     */
    NOTA_CREDITO("Nota de Crédito", "Credit note (reduces debt)", true, true),

    /**
     * Debit note (Nota de Débito).
     * Increases customer debt or supplier payment.
     * Used for additional charges or corrections.
     * Applies to: Sales only (not typical for purchases)
     */
    NOTA_DEBITO("Nota de Débito", "Debit note (increases debt)", true, false),

    /**
     * Receipt (Resguardo).
     * For immediate cash transactions or point-of-sale.
     * Simpler format, used for quick transactions.
     * Applies to: Sales only
     */
    RESGUARDO("Resguardo", "Receipt (immediate transaction)", false, false);

    private final String spanishName;
    private final String description;
    private final boolean requiresSequentialNumbering;
    private final boolean applicableToPurchase;

    InvoiceDocumentType(String spanishName, String description, boolean requiresSequentialNumbering, boolean applicableToPurchase) {
        this.spanishName = spanishName;
        this.description = description;
        this.requiresSequentialNumbering = requiresSequentialNumbering;
        this.applicableToPurchase = applicableToPurchase;
    }

    public String getSpanishName() {
        return spanishName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if this document type requires sequential numbering per year.
     * In Spain, FACTURA and NOTA_CREDITO require sequential numbering (001/2026, 002/2026, etc.)
     * while RESGUARDO might not require it.
     *
     * @return true if sequential numbering is required
     */
    public boolean requiresSequentialNumbering() {
        return requiresSequentialNumbering;
    }

    /**
     * Check if this document type can be used for purchase invoices.
     * NOTA_DEBITO and RESGUARDO are typically sales-only.
     *
     * @return true if applicable to purchase invoices
     */
    public boolean isApplicableToPurchase() {
        return applicableToPurchase;
    }

    /**
     * Check if this document type affects inventory/stock.
     * FACTURA and RESGUARDO increase stock (on purchase) or decrease (on sales).
     * NOTA_CREDITO and NOTA_DEBITO also affect stock but in opposite direction.
     *
     * @return true if this document type affects stock
     */
    public boolean affectsStock() {
        return this != RESGUARDO; // Receipts typically don't affect accounting inventory
    }
}
