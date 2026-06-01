package com.zaphirio.retailapi.inventory.repository;

import com.zaphirio.retailapi.inventory.model.InventorySession;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for InventorySession entity.
 */
@Repository
public interface InventorySessionRepository extends TenantAwareRepository<InventorySession, UUID> {

    /**
     * Find inventory sessions by branch.
     */
    List<InventorySession> findByBranchId(UUID branchId);

    /**
     * Find inventory sessions by deposit.
     */
    List<InventorySession> findByDepositId(UUID depositId);

    /**
     * Find inventory sessions by branch and deposit.
     */
    List<InventorySession> findByBranchIdAndDepositId(UUID branchId, UUID depositId);

    /**
     * Find inventory sessions by date.
     */
    List<InventorySession> findBySessionDate(LocalDate sessionDate);

    /**
     * Find inventory sessions by status.
     */
    List<InventorySession> findByStatus(InventorySession.InventorySessionStatus status);

    /**
     * Find sessions by status list (e.g., active sessions).
     */
    List<InventorySession> findByStatusIn(List<InventorySession.InventorySessionStatus> statuses);

    /**
     * Find inventory sessions by date range.
     */
    List<InventorySession> findBySessionDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Find sessions initiated by a specific user.
     */
    List<InventorySession> findByInitiatedByUserId(UUID userId);

    /**
     * Find the most recent session for a deposit.
     */
    Optional<InventorySession> findFirstByDepositIdOrderBySessionDateDesc(UUID depositId);
}
