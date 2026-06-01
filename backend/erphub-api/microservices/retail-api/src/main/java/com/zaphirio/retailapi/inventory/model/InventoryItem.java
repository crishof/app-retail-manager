package com.zaphirio.retailapi.inventory.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * InventoryItem entity - Represents a counted line item during a periodic inventory session.
 * 
 * Supports counting in 3 internal locations within a deposit:
 * - Zona A (Zone A): primary storage area
 * - Zona B (Zone B): secondary/overflow area
 * - Zona C (Zone C): third storage area
 * 
 * The system counts each location separately and can calculate total and variance.
 */
@Entity
@Table(name = "tbl_inventory_items", indexes = {
        @Index(name = "idx_inventory_item_session", columnList = "session_id"),
        @Index(name = "idx_inventory_item_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Parent inventory session (N:1 relationship).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InventorySession session;

    /**
     * Product ID being counted.
     */
    @Column(name = "product_id", nullable = false)
    private UUID productId;

    /**
     * System quantity (from Stock record).
     */
    @Column(name = "system_quantity")
    private int systemQuantity;

    /**
     * Counted quantity in Zona A (primary storage).
     */
    @Column(name = "zona_a_count")
    private int zonaACount;

    /**
     * Counted quantity in Zona B (secondary storage).
     */
    @Column(name = "zona_b_count")
    private int zonaBCount;

    /**
     * Counted quantity in Zona C (tertiary storage).
     */
    @Column(name = "zona_c_count")
    private int zonaCCount;

    /**
     * Total physical count (sum of all zones).
     */
    @Column(name = "total_count")
    private int totalCount;

    /**
     * Variance (physical - system quantity).
     * Positive = inventory surplus
     * Negative = inventory shortage
     */
    @Column(name = "variance")
    private int variance;

    /**
     * Notes about this item count (e.g., damage, mark-ups, discrepancies).
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Display order within the session.
     */
    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * Audit: creation timestamp.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /**
     * Calculate total count from all zones.
     */
    public void calculateTotal() {
        this.totalCount = this.zonaACount + this.zonaBCount + this.zonaCCount;
    }

    /**
     * Calculate variance between physical and system quantities.
     */
    public void calculateVariance() {
        this.variance = this.totalCount - this.systemQuantity;
    }

    /**
     * Update all calculations (total and variance).
     */
    public void updateCalculations() {
        calculateTotal();
        calculateVariance();
    }

    /**
     * Check if this item has a discrepancy.
     */
    public boolean hasDiscrepancy() {
        return this.variance != 0;
    }

    /**
     * Get variance percentage relative to system quantity.
     */
    public double getVariancePercentage() {
        if (this.systemQuantity == 0) {
            return 0;
        }
        return (double) this.variance / this.systemQuantity * 100;
    }
}
