package com.zaphirio.retailapi.inventory.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * InventorySession entity - Represents a periodic inventory count (conteo).
 * 
 * Lifecycle:
 * - DRAFT: Session being prepared, not yet started
 * - IN_PROGRESS: Counting is active
 * - COMPLETED: Counting finished, adjustments pending
 * - CONFIRMED: Final adjustments applied, session closed
 * 
 * Typical flow: DRAFT → IN_PROGRESS → COMPLETED → CONFIRMED
 */
@Entity
@Table(name = "tbl_inventory_sessions", indexes = {
        @Index(name = "idx_inventory_branch", columnList = "branch_id"),
        @Index(name = "idx_inventory_deposit", columnList = "deposit_id"),
        @Index(name = "idx_inventory_date", columnList = "session_date"),
        @Index(name = "idx_inventory_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Branch ID (sucursal) for this inventory session.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Deposit/warehouse ID where the inventory count is happening.
     */
    @Column(name = "deposit_id", nullable = false)
    private UUID depositId;

    /**
     * Session creation date.
     */
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    /**
     * Session start time.
     */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /**
     * Session end time.
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * Session status: DRAFT, IN_PROGRESS, COMPLETED, CONFIRMED.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InventorySessionStatus status = InventorySessionStatus.DRAFT;

    /**
     * User ID who initiated the count.
     */
    @Column(name = "initiated_by_user_id")
    private UUID initiatedByUserId;

    /**
     * User ID who confirmed the count.
     */
    @Column(name = "confirmed_by_user_id")
    private UUID confirmedByUserId;

    /**
     * Notes/observations about the count.
     */
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    /**
     * Inventory items counted in this session (1:N relationship).
     */
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<InventoryItem> items = new ArrayList<>();

    /**
     * Multi-tenant support.
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * Audit: creation timestamp.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Audit: last modification timestamp.
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Inventory session status enum.
     */
    public enum InventorySessionStatus {
        DRAFT("Draft, not yet started"),
        IN_PROGRESS("Counting in progress"),
        COMPLETED("Counting finished, pending confirmation"),
        CONFIRMED("Confirmed and closed");

        private final String description;

        InventorySessionStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Start the inventory count.
     */
    public void start(UUID userId) {
        if (this.status != InventorySessionStatus.DRAFT) {
            throw new IllegalStateException("Can only start DRAFT sessions");
        }
        this.status = InventorySessionStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
        this.initiatedByUserId = userId;
    }

    /**
     * Complete the inventory count.
     */
    public void complete() {
        if (this.status != InventorySessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Can only complete IN_PROGRESS sessions");
        }
        this.status = InventorySessionStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Confirm and close the inventory session.
     */
    public void confirm(UUID userId) {
        if (this.status != InventorySessionStatus.COMPLETED) {
            throw new IllegalStateException("Can only confirm COMPLETED sessions");
        }
        this.status = InventorySessionStatus.CONFIRMED;
        this.confirmedByUserId = userId;
    }

    /**
     * Check if session is active (can add/edit items).
     */
    public boolean isActive() {
        return this.status == InventorySessionStatus.IN_PROGRESS;
    }
}
