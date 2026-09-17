package com.zaphirio.retailapi.operation.quote.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Quote entity (presupuesto).
 * Represents a quotation/proposal sent to a customer.
 *
 * Lifecycle:
 * - DRAFT: Quote being prepared
 * - SENT: Quote sent to customer
 * - ACCEPTED: Customer accepted the quote
 * - REJECTED: Customer rejected the quote
 * - EXPIRED: Quote has passed expiration date
 * - CONVERTED_TO_SALE: Quote converted to sale (linked via sale_id)
 */
@Entity
@Table(name = "tbl_quotes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Customer ID.
     * References the party/customer entity.
     */
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    /**
     * Branch ID (sucursal) where quote originated.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Location ID within branch (optional).
     */
    @Column(name = "location_id")
    private UUID locationId;

    /**
     * Sequential quote number per year.
     * Format: Q001/2026, Q002/2026, etc.
     */
    @Column(name = "number", length = 20, nullable = false)
    private String number;

    /**
     * Quote creation date.
     */
    @Column(name = "creation_date", nullable = false)
    private LocalDate creationDate;

    /**
     * Quote expiration date (when quote is no longer valid).
     */
    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    /**
     * Validity in days (from creation date).
     */
    @Column(name = "validity_days")
    private Integer validityDays;

    /**
     * Total quote amount (incl. VAT).
     */
    @Column(name = "total_price", nullable = false)
    private double totalPrice;

    /**
     * Quote status.
     * DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED_TO_SALE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private QuoteStatus status = QuoteStatus.DRAFT;

    /**
     * Sale ID (when converted to sale).
     * References the Sale entity this quote generated.
     */
    @Column(name = "sale_id")
    private UUID saleId;

    /**
     * Quote line items (1:N relationship).
     */
    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<QuoteItem> items = new ArrayList<>();

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
     * Quote status enum.
     */
    public enum QuoteStatus {
        DRAFT("Draft"),
        SENT("Sent to customer"),
        ACCEPTED("Customer accepted"),
        REJECTED("Customer rejected"),
        EXPIRED("Quote expired"),
        CONVERTED_TO_SALE("Converted to sale");

        private final String description;

        QuoteStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }

        /**
         * Check if quote is still valid (not expired or rejected).
         */
        public boolean isValid() {
            return this != EXPIRED && this != REJECTED && this != CONVERTED_TO_SALE;
        }
    }

    /**
     * Check if quote has expired based on expiration date.
     */
    public boolean isExpired() {
        return LocalDate.now().isAfter(expirationDate);
    }

    /**
     * Convert quote to sale.
     */
    public void convertToSale(UUID newSaleId) {
        this.saleId = newSaleId;
        this.status = QuoteStatus.CONVERTED_TO_SALE;
    }
}
