package com.zaphirio.retailapi.inventory.controller;

import com.zaphirio.retailapi.inventory.dto.*;
import com.zaphirio.retailapi.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Inventory operations.
 * Handles inventory sessions (periodic conteo) and items with 3 location counts.
 */
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;

    // ==================== SESSION ENDPOINTS ====================

    /**
     * Create a new inventory session.
     */
    @PostMapping("/sessions")
    public ResponseEntity<InventorySessionResponse> createSession(
            @Valid @RequestBody CreateInventorySessionRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/inventory/sessions - Create new inventory session");
        InventorySessionResponse response = inventoryService.createSession(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get inventory session by ID.
     */
    @GetMapping("/sessions/{id}")
    public ResponseEntity<InventorySessionResponse> getSessionById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/{} - Fetch session", id);
        InventorySessionResponse response = inventoryService.getSessionById(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all inventory sessions.
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<InventorySessionResponse>> getAllSessions(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions - Fetch all sessions");
        List<InventorySessionResponse> responses = inventoryService.getAllSessions(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get inventory sessions by branch.
     */
    @GetMapping("/sessions/branch/{branchId}")
    public ResponseEntity<List<InventorySessionResponse>> getSessionsByBranch(
            @PathVariable UUID branchId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/branch/{} - Fetch by branch", branchId);
        List<InventorySessionResponse> responses = inventoryService.getSessionsByBranch(branchId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get inventory sessions by deposit.
     */
    @GetMapping("/sessions/deposit/{depositId}")
    public ResponseEntity<List<InventorySessionResponse>> getSessionsByDeposit(
            @PathVariable UUID depositId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/deposit/{} - Fetch by deposit", depositId);
        List<InventorySessionResponse> responses = inventoryService.getSessionsByDeposit(depositId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get inventory sessions by status.
     */
    @GetMapping("/sessions/status/{status}")
    public ResponseEntity<List<InventorySessionResponse>> getSessionsByStatus(
            @PathVariable String status,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/status/{} - Fetch by status", status);
        List<InventorySessionResponse> responses = inventoryService.getSessionsByStatus(status, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get active inventory sessions.
     */
    @GetMapping("/sessions/active")
    public ResponseEntity<List<InventorySessionResponse>> getActiveSessions(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/active - Fetch active sessions");
        List<InventorySessionResponse> responses = inventoryService.getActiveSessions(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get inventory sessions by date range.
     */
    @GetMapping("/sessions/date-range")
    public ResponseEntity<List<InventorySessionResponse>> getSessionsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/date-range - Fetch between {} and {}", startDate, endDate);
        List<InventorySessionResponse> responses = inventoryService.getSessionsByDateRange(startDate, endDate, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update an inventory session.
     */
    @PutMapping("/sessions/{id}")
    public ResponseEntity<InventorySessionResponse> updateSession(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInventorySessionRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/v1/inventory/sessions/{} - Update session", id);
        InventorySessionResponse response = inventoryService.updateSession(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Start an inventory count (DRAFT → IN_PROGRESS).
     */
    @PostMapping("/sessions/{id}/start")
    public ResponseEntity<InventorySessionResponse> startSession(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/inventory/sessions/{}/start - Start count", id);
        InventorySessionResponse response = inventoryService.startSession(id, userId, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Complete the inventory count (IN_PROGRESS → COMPLETED).
     */
    @PostMapping("/sessions/{id}/complete")
    public ResponseEntity<InventorySessionResponse> completeSession(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/inventory/sessions/{}/complete - Complete count", id);
        InventorySessionResponse response = inventoryService.completeSession(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm the inventory session (COMPLETED → CONFIRMED).
     */
    @PostMapping("/sessions/{id}/confirm")
    public ResponseEntity<InventorySessionResponse> confirmSession(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/inventory/sessions/{}/confirm - Confirm count", id);
        InventorySessionResponse response = inventoryService.confirmSession(id, userId, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an inventory session.
     */
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("DELETE /api/v1/inventory/sessions/{} - Delete session", id);
        inventoryService.deleteSession(id, tenantId);
        return ResponseEntity.noContent().build();
    }

    // ==================== ITEM ENDPOINTS ====================

    /**
     * Add item to inventory session.
     */
    @PostMapping("/sessions/{sessionId}/items")
    public ResponseEntity<InventoryItemResponse> addItem(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CreateInventoryItemRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/inventory/sessions/{}/items - Add item", sessionId);
        InventoryItemResponse response = inventoryService.addItem(sessionId, request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get inventory item by ID.
     */
    @GetMapping("/items/{id}")
    public ResponseEntity<InventoryItemResponse> getItemById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/items/{} - Fetch item", id);
        InventoryItemResponse response = inventoryService.getItemById(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get items by session.
     */
    @GetMapping("/sessions/{sessionId}/items")
    public ResponseEntity<List<InventoryItemResponse>> getItemsBySession(
            @PathVariable UUID sessionId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/{}/items - Fetch items", sessionId);
        List<InventoryItemResponse> responses = inventoryService.getItemsBySession(sessionId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get items with discrepancies in a session.
     */
    @GetMapping("/sessions/{sessionId}/discrepancies")
    public ResponseEntity<List<InventoryItemResponse>> getDiscrepanciesBySession(
            @PathVariable UUID sessionId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/inventory/sessions/{}/discrepancies - Fetch discrepancies", sessionId);
        List<InventoryItemResponse> responses = inventoryService.getDiscrepanciesBySession(sessionId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update inventory item.
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<InventoryItemResponse> updateItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInventoryItemRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/v1/inventory/items/{} - Update item", id);
        InventoryItemResponse response = inventoryService.updateItem(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete inventory item.
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("DELETE /api/v1/inventory/items/{} - Delete item", id);
        inventoryService.deleteItem(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
