package com.zaphirio.retailapi.operation.invoice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.zaphirio.retailapi.shared.fiscal.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Purchase Invoice entity (comprobante de compra).
 * Represents a supplier invoice (factura de proveedor) received from a vendor.
 *
 * Separate table from the legacy tbl_supplier_invoice (which may eventually become this).
 * This is part of the Spain-compliant invoice hierarchy refactoring.
 *
 * Relationships:
 * - N:1 with Supplier: Multiple purchase invoices from same supplier
 * - 1:N with PurchaseInvoiceItem: Invoice contains multiple line items
 */
@Entity
@Table(name = "tbl_purchase_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Supplier ID (N:1 relationship).
     * References the party/supplier entity.
     */
    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    /**
     * Branch ID (sucursal) where invoice received.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Location ID within branch (optional, for stock tracking).
     */
    @Column(name = "location_id")
    private UUID locationId;

    /**
     * Sequential invoice number per year.
     * Format: 001/2026, 002/2026, etc.
     */
    @Column(name = "number", length = 20, nullable = false)
    private String number;

    /**
     * Document type (FACTURA, NOTA_CREDITO, etc.).
     */
    @Column(name = "document_type", length = 20, nullable = false)
    private String documentType;

    /**
     * Original supplier invoice number (for reference/reconciliation).
     * This is the vendor's invoice number, not our sequential number.
     */
    @Column(name = "supplier_invoice_number", length = 30)
    private String supplierInvoiceNumber;

    /**
     * Invoice issue date (when received from supplier).
     */
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    /**
     * Invoice due date (payment deadline to supplier).
     */
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Total amount (incl. VAT).
     */
    @Column(name = "total_price", nullable = false)
    private double totalPrice;

    /**
     * Operational status (DRAFT, ISSUED, PENDING_PAYMENT, PAID, etc.).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    /**
     * Withholding tax percentage (if applicable).
     * Some suppliers are subject to withholding taxes.
     * Expressed as percentage (e.g., 15.0 for 15%).
     */
    @Column(name = "retention_percentage")
    private BigDecimal retentionPercentage = BigDecimal.ZERO;

    /**
     * Calculated withholding tax amount.
     * Amount withheld from payment to supplier.
     */
    @Column(name = "retention_amount")
    private BigDecimal retentionAmount = BigDecimal.ZERO;

    /**
     * Purchase invoice line items (1:N relationship).
     */
    @OneToMany(mappedBy = "purchaseInvoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseInvoiceItem> items = new ArrayList<>();

    /**
     * Multi-tenant support.
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * Observations/notes.
     */
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    /**
     * Calculate the amount due to supplier after withholding.
     */
    public double getAmountDueToSupplier() {
        BigDecimal retention = retentionAmount != null ? retentionAmount : BigDecimal.ZERO;
        return totalPrice - retention.doubleValue();
    }

    /**
     * Recalculate retention amount based on percentage.
     */
    public void recalculateRetention() {
        if (retentionPercentage == null || retentionPercentage.compareTo(BigDecimal.ZERO) == 0) {
            this.retentionAmount = BigDecimal.ZERO;
        } else {
            // Calculate withholding on total amount
            BigDecimal amount = BigDecimal.valueOf(totalPrice);
            this.retentionAmount = amount.multiply(retentionPercentage).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        }
    }
}
