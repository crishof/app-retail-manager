package com.zaphirio.retailapi.operation.invoice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.zaphirio.retailapi.shared.fiscal.InvoiceStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Sales Invoice entity (comprobante de venta).
 * Represents a legal invoice issued to a customer.
 *
 * Separate table from the legacy tbl_supplier_invoice (which is now for purchase invoices).
 * This is part of the Spain-compliant invoice hierarchy refactoring.
 *
 * Relationships:
 * - 1:1 with Sale: Each Sales Invoice corresponds to one Sale operation
 * - N:1 with Customer: Multiple invoices can be issued to same customer
 * - 1:N with SalesInvoiceItem: Invoice contains multiple line items
 */
@Entity
@Table(name = "tbl_sales_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Sale ID (1:1 relationship).
     * Links this invoice to its corresponding Sale operation.
     */
    @Column(name = "sale_id", unique = true, nullable = false)
    private UUID saleId;

    /**
     * Customer ID (N:1 relationship).
     * References the party/customer entity.
     */
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    /**
     * Branch ID (sucursal) where invoice originated.
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
     * Document type (FACTURA, NOTA_CREDITO, NOTA_DEBITO, RESGUARDO).
     */
    @Column(name = "document_type", length = 20, nullable = false)
    private String documentType;

    /**
     * Invoice issue date.
     */
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    /**
     * Invoice due date (payment deadline).
     */
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Total amount (incl. VAT).
     */
    @Column(name = "total_price", nullable = false)
    private double totalPrice;

    /**
     * Operational status (DRAFT, ISSUED, PAID, etc.).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    /**
     * Payment status enum for sales invoices.
     */
    public enum PaymentStatus {
        PENDING("Pending payment"),
        PARTIAL("Partially paid"),
        PAID("Fully paid");

        private final String description;

        PaymentStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Payment status (PENDING, PARTIAL, PAID).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /**
     * Amount already paid by customer.
     */
    @Column(name = "amount_paid")
    private double amountPaid = 0;

    /**
     * Payment method used (optional).
     */
    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    /**
     * Sales invoice line items (1:N relationship).
     */
    @OneToMany(mappedBy = "salesInvoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SalesInvoiceItem> items = new ArrayList<>();

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
     * Calculate remaining amount to be paid.
     */
    public double getRemainingAmount() {
        return totalPrice - amountPaid;
    }

    /**
     * Register a payment from customer.
     */
    public double recordPayment(double paymentAmount) {
        amountPaid += paymentAmount;

        // Update payment status
        if (amountPaid >= totalPrice) {
            this.paymentStatus = PaymentStatus.PAID;
        } else if (amountPaid > 0) {
            this.paymentStatus = PaymentStatus.PARTIAL;
        } else {
            this.paymentStatus = PaymentStatus.PENDING;
        }

        return getRemainingAmount();
    }
}
