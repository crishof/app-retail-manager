package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.SalesInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Sales Invoice Item repository.
 * Provides persistence operations for line items on sales invoices.
 */
@Repository
public interface SalesInvoiceItemRepository extends JpaRepository<SalesInvoiceItem, UUID> {

    /**
     * Find all items for a sales invoice.
     *
     * @param salesInvoiceId the sales invoice ID
     * @return list of items on the invoice (sorted by order index)
     */
    List<SalesInvoiceItem> findBySalesInvoiceIdOrderByOrderIndex(UUID salesInvoiceId);

    /**
     * Find all items for a sales invoice by product ID.
     *
     * @param salesInvoiceId the sales invoice ID
     * @param productId      the product ID
     * @return list of items on the invoice that reference this product
     */
    List<SalesInvoiceItem> findBySalesInvoiceIdAndProductId(UUID salesInvoiceId, UUID productId);

    /**
     * Find all invoice items that reference a product.
     *
     * @param productId the product ID
     * @return list of invoice items referencing this product
     */
    List<SalesInvoiceItem> findByProductId(UUID productId);

    /**
     * Count items on a sales invoice.
     *
     * @param salesInvoiceId the sales invoice ID
     * @return number of items on the invoice
     */
    long countBySalesInvoiceId(UUID salesInvoiceId);

    /**
     * Delete all items for a sales invoice.
     *
     * @param salesInvoiceId the sales invoice ID
     */
    void deleteBySalesInvoiceId(UUID salesInvoiceId);
}
