package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoice;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Purchase Invoice repository.
 * Specialized repository for PurchaseInvoice operations.
 *
 * Extends TenantAwareRepository for automatic tenant filtering.
 * Provides purchase-specific query methods for supplier invoices.
 */
@Repository
public interface PurchaseInvoiceRepository extends TenantAwareRepository<PurchaseInvoice, UUID> {

    /**
     * Find all purchase invoices from a supplier.
     *
     * @param supplierId the supplier ID
     * @return list of purchase invoices received from the supplier
     */
    List<PurchaseInvoice> findBySupplierId(UUID supplierId);

    /**
     * Find all purchase invoices from a supplier by branch.
     *
     * @param supplierId the supplier ID
     * @param branchId   the branch ID
     * @return list of purchase invoices filtered by supplier and branch
     */
    List<PurchaseInvoice> findBySupplierIdAndBranchId(UUID supplierId, UUID branchId);

    /**
     * Find a purchase invoice by supplier invoice number.
     * Useful for matching supplier statements and reconciliation.
     *
     * @param supplierInvoiceNumber the supplier's invoice number
     * @return the purchase invoice, or empty if not found
     */
    Optional<PurchaseInvoice> findBySupplierInvoiceNumber(String supplierInvoiceNumber);

    /**
     * Check if purchase invoice exists with given supplier invoice number.
     *
     * @param supplierInvoiceNumber the supplier's invoice number
     * @return true if invoice exists
     */
    boolean existsBySupplierInvoiceNumber(String supplierInvoiceNumber);

    /**
     * Find all purchase invoices by status.
     *
     * @param statusValue the status (DRAFT, ISSUED, PENDING_PAYMENT, etc.)
     * @return list of purchase invoices with the specified status
     */
    List<PurchaseInvoice> findByStatus(String statusValue);

    /**
     * Find all unpaid or partially paid invoices from a supplier.
     * Useful for AP aging analysis and payment scheduling.
     *
     * @param supplierId the supplier ID
     * @return list of invoices awaiting payment to supplier
     */
    List<PurchaseInvoice> findBySupplierIdAndStatusIn(UUID supplierId, List<String> statuses);

    /**
     * Find all purchase invoices received within a date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of invoices received in the date range
     */
    List<PurchaseInvoice> findByIssueDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find all purchase invoices by branch and date range.
     *
     * @param branchId  the branch ID
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of invoices for the branch in the date range
     */
    List<PurchaseInvoice> findByBranchIdAndIssueDateBetween(UUID branchId, LocalDate startDate, LocalDate endDate);

    /**
     * Find all purchase invoices with withholding taxes.
     * Used for tax compliance and withholding reporting.
     *
     * @return list of invoices with retention percentage > 0
     */
    List<PurchaseInvoice> findByRetentionPercentageGreaterThan(java.math.BigDecimal percentage);

    /**
     * Find all purchase invoices from supplier with withholding.
     *
     * @param supplierId the supplier ID
     * @return list of invoices from supplier that have retention
     */
    List<PurchaseInvoice> findBySupplierIdAndRetentionPercentageGreaterThan(UUID supplierId, java.math.BigDecimal percentage);
}
