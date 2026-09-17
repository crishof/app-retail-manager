package com.zaphirio.retailapi.operation.quote.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Quote Item entity.
 * Represents a line item in a quote.
 */
@Entity
@Table(name = "tbl_quote_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Parent quote (N:1 relationship).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    /**
     * Product ID (optional).
     */
    @Column(name = "product_id")
    private UUID productId;

    /**
     * Item description.
     */
    @Column(name = "description", length = 255, nullable = false)
    private String description;

    /**
     * Quantity.
     */
    @Column(name = "quantity", nullable = false)
    private double quantity;

    /**
     * Unit price (before tax).
     */
    @Column(name = "unit_price", nullable = false)
    private double unitPrice;

    /**
     * Line discount percentage.
     */
    @Column(name = "discount_percentage")
    private double discountPercentage = 0;

    /**
     * VAT tax rate: '0', '7', or '21'.
     */
    @Column(name = "tax_rate", length = 3, nullable = false)
    private String taxRate;

    /**
     * Line total (before tax).
     */
    @Column(name = "line_total", nullable = false)
    private double lineTotal;

    /**
     * Display order.
     */
    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * Audit timestamp.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /**
     * Calculate line total.
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
     * Calculate tax amount.
     */
    public double calculateTaxAmount() {
        double rate = Double.parseDouble(taxRate);
        return lineTotal * (rate / 100.0);
    }

    /**
     * Calculate total with tax.
     */
    public double getLineTotalWithTax() {
        return lineTotal + calculateTaxAmount();
    }

    /**
     * Update line total.
     */
    public void updateLineTotal() {
        this.lineTotal = calculateLineTotal();
    }
}
