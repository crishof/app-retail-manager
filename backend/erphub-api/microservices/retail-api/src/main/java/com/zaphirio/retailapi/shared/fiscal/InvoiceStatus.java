package com.zaphirio.retailapi.shared.fiscal;

/**
 * Invoice operational status (different from finalization status).
 * Tracks the operational lifecycle of invoices (sales/purchase).
 *
 * DRAFT -> ISSUED -> PAID (for sales)
 * DRAFT -> RECEIVED -> PENDING_PAYMENT (for purchases)
 */
public enum InvoiceStatus {

    /**
     * Invoice is in draft status.
     * Can be freely edited, not yet submitted or issued.
     */
    DRAFT("Draft", "Invoice is being prepared"),

    /**
     * Invoice has been issued.
     * For sales: sent to customer
     * For purchases: received from supplier
     */
    ISSUED("Issued", "Invoice has been issued/received"),

    /**
     * Invoice payment is pending.
     * For sales: awaiting customer payment
     * For purchases: awaiting payment to supplier
     */
    PENDING_PAYMENT("Pending Payment", "Awaiting payment"),

    /**
     * Invoice has been partially paid.
     * Only for invoices with partial payment capability.
     */
    PARTIALLY_PAID("Partially Paid", "Partial payment received/made"),

    /**
     * Invoice has been fully paid.
     * For sales: customer paid the full amount
     * For purchases: full payment made to supplier
     */
    PAID("Paid", "Invoice has been fully paid"),

    /**
     * Invoice has been cancelled.
     * Typically replaced by a credit note or debit note.
     */
    CANCELLED("Cancelled", "Invoice has been cancelled"),

    /**
     * Invoice has expired (past due date and no payment).
     * Used for reporting and aging analysis.
     */
    OVERDUE("Overdue", "Invoice is past due");

    private final String displayName;
    private final String description;

    InvoiceStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if invoice is in a final state (no further changes expected).
     *
     * @return true if invoice is PAID, CANCELLED, or OVERDUE
     */
    public boolean isFinal() {
        return this == PAID || this == CANCELLED || this == OVERDUE;
    }

    /**
     * Check if invoice is awaiting payment.
     *
     * @return true if invoice is PENDING_PAYMENT, PARTIALLY_PAID, or OVERDUE
     */
    public boolean isAwaitingPayment() {
        return this == PENDING_PAYMENT || this == PARTIALLY_PAID || this == OVERDUE;
    }
}
