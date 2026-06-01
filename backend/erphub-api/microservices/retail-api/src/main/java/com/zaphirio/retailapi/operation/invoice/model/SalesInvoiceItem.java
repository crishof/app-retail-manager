package com.zaphirio.retailapi.operation.invoice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Sales Invoice Item entity.
 * Represents a single line item on a sales invoice.
 */
@Entity
@Table(name = "tbl_sales_invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Parent sales invoice (N:1 relationship).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_invoice_id", nullable = false)
    private SalesInvoice salesInvoice;

    /**
     * Product ID (optional, can be NULL for services or custom items).
     */
    @Column(name = "product_id")
    private UUID productId;

    /**
     * Item description.
     */
    @Column(name = "description", length = 255, nullable = false)
    private String description;

    /**
     * Quantity of item.
     */
    @Column(name = "quantity", precision = 15, scale = 4, nullable = false)
    private double quantity;

    /**
     * Unit price (before tax).
     */
    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private double unitPrice;

    /**
     * Line discount percentage (optional).
     */
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private double discountPercentage = 0;

    /**
     * VAT tax rate for this item: '0', '7', or '21'.
     */
    @Column(name = "tax_rate", length = 3, nullable = false)
    private String taxRate;

    /**
     * Line total (before tax).
     */
    @Column(name = "line_total", precision = 15, scale = 2, nullable = false)
    private double lineTotal;

    /**
     * Display order on invoice.
     */
    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * Audit: timestamp when item was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /**
     * Calculate line total based on quantity, unit price, and discount.
     */
    public double calculateLineTotal() {
        double subtotal = quantity * unitPrice;
        if (discountPercentage > 0) {
            double discount = subtotal * (discountPercentage / 100.0);
            subtotal -= discount;
        }
        return subtotal;
    }

    /**
     * Calculate tax amount for this line item.
     */
    public double calculateTaxAmount() {
        double rate = Double.parseDouble(taxRate);
        return lineTotal * (rate / 100.0);
    }

    /**
     * Calculate total amount including tax for this line.
     */
    public double getLineTotalWithTax() {
        return lineTotal + calculateTaxAmount();
    }

    /**
     * Update line total based on current quantity, price, and discount.
     */
    public void updateLineTotal() {
        this.lineTotal = calculateLineTotal();
    }

    /**
     * Validate tax rate is one of allowed Spain VAT rates.
     */
    public boolean isValidTaxRate() {
        return "0".equals(taxRate) || "7".equals(taxRate) || "21".equals(taxRate);
    }
}
