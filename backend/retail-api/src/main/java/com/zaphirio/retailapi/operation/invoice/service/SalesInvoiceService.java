package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Sales Invoice operations.
 */
public interface SalesInvoiceService {

    /**
     * Create a new sales invoice.
     *
     * @param request the create request
     * @param tenantId the tenant ID
     * @return the created invoice response
     */
    SalesInvoiceResponse create(CreateSalesInvoiceRequest request, Long tenantId);

    /**
     * Get sales invoice by ID.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     * @return the invoice response
     */
    SalesInvoiceResponse getById(UUID id, Long tenantId);

    /**
     * Get all sales invoices (paginated would be better for production).
     *
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<SalesInvoiceResponse> getAll(Long tenantId);

    /**
     * Get all sales invoices for a customer.
     *
     * @param customerId the customer ID
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<SalesInvoiceResponse> getByCustomerId(UUID customerId, Long tenantId);

    /**
     * Get sales invoice by sale ID (1:1 relationship).
     *
     * @param saleId the sale ID
     * @param tenantId the tenant ID
     * @return the invoice response
     */
    SalesInvoiceResponse getBySaleId(UUID saleId, Long tenantId);

    /**
     * Get all unpaid or partially paid invoices for a customer.
     *
     * @param customerId the customer ID
     * @param tenantId the tenant ID
     * @return list of unpaid invoice responses
     */
    List<SalesInvoiceResponse> getUnpaidByCustomerId(UUID customerId, Long tenantId);

    /**
     * Get sales invoices by date range.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @param tenantId the tenant ID
     * @return list of invoice responses
     */
    List<SalesInvoiceResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId);

    /**
     * Update a sales invoice.
     *
     * @param id the invoice ID
     * @param request the update request
     * @param tenantId the tenant ID
     * @return the updated invoice response
     */
    SalesInvoiceResponse update(UUID id, UpdateSalesInvoiceRequest request, Long tenantId);

    /**
     * Record a payment for a sales invoice.
     *
     * @param id the invoice ID
     * @param paymentAmount the amount paid
     * @param tenantId the tenant ID
     * @return the updated invoice response
     */
    SalesInvoiceResponse recordPayment(UUID id, double paymentAmount, Long tenantId);

    /**
     * Cancel a sales invoice.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     * @return the cancelled invoice response
     */
    SalesInvoiceResponse cancel(UUID id, Long tenantId);

    /**
     * Delete a sales invoice.
     *
     * @param id the invoice ID
     * @param tenantId the tenant ID
     */
    void delete(UUID id, Long tenantId);
}
