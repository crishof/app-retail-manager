package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Purchase Invoice Item repository.
 * Provides persistence operations for line items on purchase invoices.
 */
@Repository
public interface PurchaseInvoiceItemRepository extends JpaRepository<PurchaseInvoiceItem, UUID> {

    /**
     * Find all items for a purchase invoice.
     *
     * @param purchaseInvoiceId the purchase invoice ID
     * @return list of items on the invoice (sorted by order index)
     */
    List<PurchaseInvoiceItem> findByPurchaseInvoiceIdOrderByOrderIndex(UUID purchaseInvoiceId);

    /**
     * Find all items for a purchase invoice by product ID.
     *
     * @param purchaseInvoiceId the purchase invoice ID
     * @param productId         the product ID
     * @return list of items on the invoice that reference this product
     */
    List<PurchaseInvoiceItem> findByPurchaseInvoiceIdAndProductId(UUID purchaseInvoiceId, UUID productId);

    /**
     * Find all invoice items that reference a product.
     *
     * @param productId the product ID
     * @return list of invoice items referencing this product
     */
    List<PurchaseInvoiceItem> findByProductId(UUID productId);

    /**
     * Count items on a purchase invoice.
     *
     * @param purchaseInvoiceId the purchase invoice ID
     * @return number of items on the invoice
     */
    long countByPurchaseInvoiceId(UUID purchaseInvoiceId);

    /**
     * Delete all items for a purchase invoice.
     *
     * @param purchaseInvoiceId the purchase invoice ID
     */
    void deleteByPurchaseInvoiceId(UUID purchaseInvoiceId);
}
