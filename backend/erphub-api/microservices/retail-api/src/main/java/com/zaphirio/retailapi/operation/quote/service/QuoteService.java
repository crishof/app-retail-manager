package com.zaphirio.retailapi.operation.quote.service;

import com.zaphirio.retailapi.operation.quote.dto.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Quote operations.
 */
public interface QuoteService {

    /**
     * Create a new quote.
     *
     * @param request the create request
     * @param tenantId the tenant ID
     * @return the created quote response
     */
    QuoteResponse create(CreateQuoteRequest request, Long tenantId);

    /**
     * Get quote by ID.
     *
     * @param id the quote ID
     * @param tenantId the tenant ID
     * @return the quote response
     */
    QuoteResponse getById(UUID id, Long tenantId);

    /**
     * Get all quotes (paginated would be better for production).
     *
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getAll(Long tenantId);

    /**
     * Get all quotes for a customer.
     *
     * @param customerId the customer ID
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getByCustomerId(UUID customerId, Long tenantId);

    /**
     * Get all quotes for a customer in a specific branch.
     *
     * @param customerId the customer ID
     * @param branchId the branch ID
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getByCustomerIdAndBranchId(UUID customerId, UUID branchId, Long tenantId);

    /**
     * Get quote by status.
     *
     * @param status the quote status
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getByStatus(String status, Long tenantId);

    /**
     * Get active (valid) quotes.
     *
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getActive(Long tenantId);

    /**
     * Get quotes by creation date range.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId);

    /**
     * Get quotes expiring soon.
     *
     * @param daysUntilExpiration number of days to check
     * @param tenantId the tenant ID
     * @return list of quote responses
     */
    List<QuoteResponse> getExpiringQuotes(int daysUntilExpiration, Long tenantId);

    /**
     * Update a quote.
     *
     * @param id the quote ID
     * @param request the update request
     * @param tenantId the tenant ID
     * @return the updated quote response
     */
    QuoteResponse update(UUID id, UpdateQuoteRequest request, Long tenantId);

    /**
     * Send a quote to customer (change status to SENT).
     *
     * @param id the quote ID
     * @param tenantId the tenant ID
     * @return the updated quote response
     */
    QuoteResponse sendQuote(UUID id, Long tenantId);

    /**
     * Accept a quote (change status to ACCEPTED).
     *
     * @param id the quote ID
     * @param tenantId the tenant ID
     * @return the updated quote response
     */
    QuoteResponse acceptQuote(UUID id, Long tenantId);

    /**
     * Reject a quote (change status to REJECTED).
     *
     * @param id the quote ID
     * @param tenantId the tenant ID
     * @return the updated quote response
     */
    QuoteResponse rejectQuote(UUID id, Long tenantId);

    /**
     * Convert quote to sale.
     *
     * @param id the quote ID
     * @param saleId the sale ID to link
     * @param tenantId the tenant ID
     * @return the updated quote response
     */
    QuoteResponse convertToSale(UUID id, UUID saleId, Long tenantId);

    /**
     * Delete a quote.
     *
     * @param id the quote ID
     * @param tenantId the tenant ID
     */
    void delete(UUID id, Long tenantId);

    /**
     * Generate next quote number for a given year.
     *
     * @param year the year
     * @param tenantId the tenant ID
     * @return the next quote number (e.g., Q001/2026)
     */
    String generateNextQuoteNumber(int year, Long tenantId);
}
