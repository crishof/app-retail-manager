package com.zaphirio.retailapi.operation.quote.repository;

import com.zaphirio.retailapi.operation.quote.model.Quote;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Quote repository interface.
 */
@Repository
public interface QuoteRepository extends TenantAwareRepository<Quote, UUID> {

    /**
     * Find quotes by customer.
     */
    List<Quote> findByCustomerId(UUID customerId);

    /**
     * Find quotes by customer and branch.
     */
    List<Quote> findByCustomerIdAndBranchId(UUID customerId, UUID branchId);

    /**
     * Find quote by sale ID (conversion relationship).
     */
    Optional<Quote> findBySaleId(UUID saleId);

    /**
     * Find quotes by status.
     */
    List<Quote> findByStatus(Quote.QuoteStatus status);

    /**
     * Find active (valid) quotes.
     */
    List<Quote> findByStatusIn(List<Quote.QuoteStatus> statuses);

    /**
     * Find quotes by creation date range.
     */
    List<Quote> findByCreationDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find quotes by expiration date range.
     */
    List<Quote> findByExpirationDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find quotes expiring soon.
     */
    List<Quote> findByExpirationDateLessThanAndStatusIn(LocalDate date, List<Quote.QuoteStatus> statuses);
}
