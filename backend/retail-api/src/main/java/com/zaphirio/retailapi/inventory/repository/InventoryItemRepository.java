package com.zaphirio.retailapi.inventory.repository;

import com.zaphirio.retailapi.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for InventoryItem entity.
 */
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    /**
     * Find items by session.
     */
    List<InventoryItem> findBySessionIdOrderByOrderIndex(UUID sessionId);

    /**
     * Find items by product within a session.
     */
    InventoryItem findBySessionIdAndProductId(UUID sessionId, UUID productId);

    /**
     * Delete items by session.
     */
    void deleteBySessionId(UUID sessionId);

    /**
     * Count items by session.
     */
    long countBySessionId(UUID sessionId);

    /**
     * Find items with discrepancies (variance != 0).
     */
    List<InventoryItem> findBySessionIdAndVarianceNot(UUID sessionId, int variance);
}
