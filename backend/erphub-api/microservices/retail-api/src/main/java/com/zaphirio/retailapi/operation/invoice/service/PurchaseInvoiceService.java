package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Purchase Invoice operations.
 */
public interface PurchaseInvoiceService {

    /**
     * Create a new purchase invoice.
     *
     * @param request the create request
     * @param tenantId the tenant ID
     * @return the created invoice response
     */
    PurchaseInvoiceResponse create(CreatePurchaseInvoiceRequest request, Long tenantId);

    /**
     * Get purchase invoice by ID.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     * @return the invoice response
     */
    PurchaseInvoiceResponse getById(UUID id, Long tenantId);

    /**
     * Get all purchase invoices.
     *
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<PurchaseInvoiceResponse> getAll(Long tenantId);

    /**
     * Get all purchase invoices from a supplier.
     *
     * @param supplierId the supplier ID
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<PurchaseInvoiceResponse> getBySupplierId(UUID supplierId, Long tenantId);

    /**
     * Get purchase invoice by supplier invoice number.
     *
     * @param supplierInvoiceNumber the supplier's invoice number
     * @param tenantId the tenant ID
     * @return the invoice response
     */
    PurchaseInvoiceResponse getBySupplierInvoiceNumber(String supplierInvoiceNumber, Long tenantId);

    /**
     * Get all unpaid or partially paid invoices.
     *
     * @param tenantId the tenant ID
     * @return list of unpaid invoice responses
     */
    List<PurchaseInvoiceResponse> getUnpaid(Long tenantId);

    /**
     * Get all unpaid invoices from a supplier.
     *
     * @param supplierId the supplier ID
     * @param tenantId the tenant ID
     * @return list of unpaid invoice responses
     */
    List<PurchaseInvoiceResponse> getUnpaidBySupplierId(UUID supplierId, Long tenantId);

    /**
     * Get purchase invoices by date range.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<PurchaseInvoiceResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId);

    /**
     * Get all invoices with withholding taxes.
     *
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<PurchaseInvoiceResponse> getWithWithholding(Long tenantId);

    /**
     * Update a purchase invoice.
     *
     * @param id the invoice ID
     * @param request the update request
     * @param tenantId the tenant ID
     * @return the updated invoice response
     */
    PurchaseInvoiceResponse update(UUID id, UpdatePurchaseInvoiceRequest request, Long tenantId);

    /**
     * Update retention percentage and recalculate retention amount.
     *
     * @param id the invoice ID
     * @param retentionPercentage the retention percentage
     * @param tenantId the tenant ID
     * @return the updated invoice response
     */
    PurchaseInvoiceResponse updateRetention(UUID id, BigDecimal retentionPercentage, Long tenantId);

    /**
     * Cancel a purchase invoice.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     * @return the cancelled invoice response
     */
    PurchaseInvoiceResponse cancel(UUID id, Long tenantId);

    /**
     * Delete a purchase invoice.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     */
    void delete(UUID id, Long tenantId);
}
