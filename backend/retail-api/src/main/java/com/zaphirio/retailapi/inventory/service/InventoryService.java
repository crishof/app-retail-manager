package com.zaphirio.retailapi.inventory.service;

import com.zaphirio.retailapi.inventory.dto.*;
import com.zaphirio.retailapi.inventory.mapper.InventoryMapper;
import com.zaphirio.retailapi.inventory.model.InventorySession;
import com.zaphirio.retailapi.inventory.model.InventoryItem;
import com.zaphirio.retailapi.inventory.repository.InventorySessionRepository;
import com.zaphirio.retailapi.inventory.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for inventory session and item operations.
 * Handles periodic inventory counting with 3 internal location support.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryService {

    private final InventorySessionRepository sessionRepository;
    private final InventoryItemRepository itemRepository;
    private final InventoryMapper mapper;

    // ==================== SESSION OPERATIONS ====================

    /**
     * Create a new inventory session.
     */
    public InventorySessionResponse createSession(CreateInventorySessionRequest request, Long tenantId) {
        log.info("Creating inventory session for deposit {} in branch {}", request.getDepositId(), request.getBranchId());

        InventorySession session = mapper.toEntity(request);
        session.setTenantId(tenantId);

        // Add items if provided
        if (request.getItems() != null) {
            for (CreateInventoryItemRequest itemRequest : request.getItems()) {
                InventoryItem item = mapper.itemToEntity(itemRequest);
                item.setSession(session);
                session.getItems().add(item);
            }
        }

        InventorySession saved = sessionRepository.save(session);
        log.info("Created inventory session with ID: {}", saved.getId());

        return mapper.sessionToResponse(saved);
    }

    /**
     * Get inventory session by ID.
     */
    @Transactional(readOnly = true)
    public InventorySessionResponse getSessionById(UUID id, Long tenantId) {
        log.debug("Fetching inventory session by ID: {}", id);
        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));
        return mapper.sessionToResponse(session);
    }

    /**
     * Get all inventory sessions.
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getAllSessions(Long tenantId) {
        log.debug("Fetching all inventory sessions");
        return sessionRepository.findAll().stream()
                .map(mapper::sessionToResponse)
                .toList();
    }

    /**
     * Get inventory sessions by branch.
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getSessionsByBranch(UUID branchId, Long tenantId) {
        log.debug("Fetching inventory sessions for branch: {}", branchId);
        return sessionRepository.findByBranchId(branchId).stream()
                .map(mapper::sessionToResponse)
                .toList();
    }

    /**
     * Get inventory sessions by deposit.
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getSessionsByDeposit(UUID depositId, Long tenantId) {
        log.debug("Fetching inventory sessions for deposit: {}", depositId);
        return sessionRepository.findByDepositId(depositId).stream()
                .map(mapper::sessionToResponse)
                .toList();
    }

    /**
     * Get inventory sessions by status.
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getSessionsByStatus(String status, Long tenantId) {
        log.debug("Fetching inventory sessions by status: {}", status);
        try {
            InventorySession.InventorySessionStatus sessionStatus = InventorySession.InventorySessionStatus.valueOf(status);
            return sessionRepository.findByStatus(sessionStatus).stream()
                    .map(mapper::sessionToResponse)
                    .toList();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid inventory session status: {}", status);
            return List.of();
        }
    }

    /**
     * Get active inventory sessions (IN_PROGRESS).
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getActiveSessions(Long tenantId) {
        log.debug("Fetching active inventory sessions");
        List<InventorySession.InventorySessionStatus> activeStatuses = List.of(
                InventorySession.InventorySessionStatus.DRAFT,
                InventorySession.InventorySessionStatus.IN_PROGRESS
        );
        return sessionRepository.findByStatusIn(activeStatuses).stream()
                .map(mapper::sessionToResponse)
                .toList();
    }

    /**
     * Get inventory sessions by date range.
     */
    @Transactional(readOnly = true)
    public List<InventorySessionResponse> getSessionsByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId) {
        log.debug("Fetching inventory sessions between {} and {}", startDate, endDate);
        return sessionRepository.findBySessionDateBetween(startDate, endDate).stream()
                .map(mapper::sessionToResponse)
                .toList();
    }

    /**
     * Update an inventory session.
     */
    public InventorySessionResponse updateSession(UUID id, UpdateInventorySessionRequest request, Long tenantId) {
        log.info("Updating inventory session: {}", id);

        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));

        if (!session.isActive()) {
            throw new RuntimeException("Cannot update session in status: " + session.getStatus());
        }

        mapper.updateEntity(session, request);

        // Update items if provided
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (UpdateInventoryItemRequest itemRequest : request.getItems()) {
                InventoryItem item = itemRepository.findById(itemRequest.getId())
                        .orElseThrow(() -> new RuntimeException("Inventory item not found: " + itemRequest.getId()));
                mapper.updateItem(item, itemRequest);
            }
        }

        InventorySession updated = sessionRepository.save(session);
        log.info("Updated inventory session: {}", id);

        return mapper.sessionToResponse(updated);
    }

    /**
     * Start the inventory count.
     */
    public InventorySessionResponse startSession(UUID id, UUID userId, Long tenantId) {
        log.info("Starting inventory session: {}", id);

        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));

        session.start(userId);
        InventorySession updated = sessionRepository.save(session);

        log.info("Started inventory session: {}", id);
        return mapper.sessionToResponse(updated);
    }

    /**
     * Complete the inventory count.
     */
    public InventorySessionResponse completeSession(UUID id, Long tenantId) {
        log.info("Completing inventory session: {}", id);

        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));

        session.complete();
        InventorySession updated = sessionRepository.save(session);

        log.info("Completed inventory session: {}", id);
        return mapper.sessionToResponse(updated);
    }

    /**
     * Confirm and close the inventory session.
     */
    public InventorySessionResponse confirmSession(UUID id, UUID userId, Long tenantId) {
        log.info("Confirming inventory session: {}", id);

        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));

        session.confirm(userId);
        InventorySession updated = sessionRepository.save(session);

        log.info("Confirmed inventory session: {}", id);
        return mapper.sessionToResponse(updated);
    }

    /**
     * Delete an inventory session.
     */
    public void deleteSession(UUID id, Long tenantId) {
        log.info("Deleting inventory session: {}", id);

        InventorySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + id));

        if (session.getStatus() != InventorySession.InventorySessionStatus.DRAFT) {
            throw new RuntimeException("Can only delete DRAFT sessions");
        }

        // Delete items first
        itemRepository.deleteBySessionId(id);

        // Delete session
        sessionRepository.delete(session);
        log.info("Deleted inventory session: {}", id);
    }

    // ==================== ITEM OPERATIONS ====================

    /**
     * Add item to inventory session.
     */
    public InventoryItemResponse addItem(UUID sessionId, CreateInventoryItemRequest request, Long tenantId) {
        log.info("Adding item to inventory session: {}", sessionId);

        InventorySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Inventory session not found: " + sessionId));

        if (!session.isActive()) {
            throw new RuntimeException("Cannot add items to inactive session");
        }

        InventoryItem item = mapper.itemToEntity(request);
        item.setSession(session);
        session.getItems().add(item);

        InventoryItem saved = itemRepository.save(item);
        log.info("Added item to session: {}", saved.getId());

        return mapper.itemToResponse(saved);
    }

    /**
     * Get inventory item by ID.
     */
    @Transactional(readOnly = true)
    public InventoryItemResponse getItemById(UUID id, Long tenantId) {
        log.debug("Fetching inventory item by ID: {}", id);
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));
        return mapper.itemToResponse(item);
    }

    /**
     * Get items by session.
     */
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getItemsBySession(UUID sessionId, Long tenantId) {
        log.debug("Fetching items for session: {}", sessionId);
        return itemRepository.findBySessionIdOrderByOrderIndex(sessionId).stream()
                .map(mapper::itemToResponse)
                .toList();
    }

    /**
     * Get items with discrepancies in a session.
     */
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getDiscrepanciesBySession(UUID sessionId, Long tenantId) {
        log.debug("Fetching items with discrepancies for session: {}", sessionId);
        return itemRepository.findBySessionIdAndVarianceNot(sessionId, 0).stream()
                .map(mapper::itemToResponse)
                .toList();
    }

    /**
     * Update inventory item.
     */
    public InventoryItemResponse updateItem(UUID id, UpdateInventoryItemRequest request, Long tenantId) {
        log.info("Updating inventory item: {}", id);

        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));

        mapper.updateItem(item, request);

        InventoryItem updated = itemRepository.save(item);
        log.info("Updated inventory item: {}", id);

        return mapper.itemToResponse(updated);
    }

    /**
     * Delete inventory item.
     */
    public void deleteItem(UUID id, Long tenantId) {
        log.info("Deleting inventory item: {}", id);

        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));

        itemRepository.delete(item);
        log.info("Deleted inventory item: {}", id);
    }
}
