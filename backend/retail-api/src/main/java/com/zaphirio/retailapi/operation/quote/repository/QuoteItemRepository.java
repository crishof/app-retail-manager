package com.zaphirio.retailapi.operation.quote.repository;

import com.zaphirio.retailapi.operation.quote.model.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Quote Item repository interface.
 */
@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, UUID> {

    /**
     * Find items by quote.
     */
    List<QuoteItem> findByQuoteIdOrderByOrderIndex(UUID quoteId);

    /**
     * Delete items by quote.
     */
    void deleteByQuoteId(UUID quoteId);
}
