package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.SalesInvoice;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Sales Invoice repository.
 * Specialized repository for SalesInvoice operations.
 *
 * Extends TenantAwareRepository for automatic tenant filtering.
 * Provides sales-specific query methods.
 */
@Repository
public interface SalesInvoiceRepository extends TenantAwareRepository<SalesInvoice, UUID> {

    /**
     * Find all sales invoices for a customer.
     *
     * @param customerId the customer ID
     * @return list of sales invoices issued to the customer
     */
    List<SalesInvoice> findByCustomerId(UUID customerId);

    /**
     * Find all sales invoices for a customer and branch.
     *
     * @param customerId the customer ID
     * @param branchId   the branch ID
     * @return list of sales invoices filtered by customer and branch
     */
    List<SalesInvoice> findByCustomerIdAndBranchId(UUID customerId, UUID branchId);

    /**
     * Find a sales invoice by its sale ID (1:1 relationship).
     *
     * @param saleId the sale ID
     * @return the sales invoice, or empty if not found
     */
    Optional<SalesInvoice> findBySaleId(UUID saleId);

    /**
     * Check if a sales invoice exists for a given sale.
     *
     * @param saleId the sale ID
     * @return true if invoice exists for this sale
     */
    boolean existsBySaleId(UUID saleId);

    /**
     * Find all sales invoices by payment status.
     *
     * @param paymentStatus the payment status (PENDING, PARTIAL, PAID, REFUNDED)
     * @return list of sales invoices with the specified payment status
     */
    List<SalesInvoice> findByPaymentStatus(SalesInvoice.PaymentStatus paymentStatus);

    /**
     * Find all unpaid or partially paid invoices for a customer.
     * Useful for AR aging analysis and payment reminders.
     *
     * @param customerId the customer ID
     * @return list of invoices awaiting payment
     */
    List<SalesInvoice> findByCustomerIdAndPaymentStatusIn(UUID customerId, List<SalesInvoice.PaymentStatus> statuses);

    /**
     * Find all sales invoices issued within a date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of invoices issued in the date range
     */
    List<SalesInvoice> findByIssueDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find all sales invoices by branch and date range.
     *
     * @param branchId  the branch ID
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of invoices for the branch in the date range
     */
    List<SalesInvoice> findByBranchIdAndIssueDateBetween(UUID branchId, LocalDate startDate, LocalDate endDate);
}
