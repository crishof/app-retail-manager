package com.zaphirio.retailapi.operation.invoice.controller;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.service.PurchaseInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Purchase Invoice operations.
 * Endpoints: GET, POST, PUT, DELETE for purchase invoices and withholding management.
 */
@RestController
@RequestMapping("/api/purchase-invoices")
@RequiredArgsConstructor
@Slf4j
public class PurchaseInvoiceController {

    private final PurchaseInvoiceService purchaseInvoiceService;

    /**
     * Create a new purchase invoice.
     */
    @PostMapping
    public ResponseEntity<PurchaseInvoiceResponse> create(
            @Valid @RequestBody CreatePurchaseInvoiceRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/purchase-invoices - Create new purchase invoice");
        PurchaseInvoiceResponse response = purchaseInvoiceService.create(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get purchase invoice by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseInvoiceResponse> getById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/{} - Fetch invoice", id);
        PurchaseInvoiceResponse response = purchaseInvoiceService.getById(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all purchase invoices.
     */
    @GetMapping
    public ResponseEntity<List<PurchaseInvoiceResponse>> getAll(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices - Fetch all invoices");
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getAll(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get purchase invoices by supplier.
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getBySupplier(
            @PathVariable UUID supplierId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/supplier/{} - Fetch by supplier", supplierId);
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getBySupplierId(supplierId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get purchase invoice by supplier invoice number.
     */
    @GetMapping("/supplier-number/{supplierNumber}")
    public ResponseEntity<PurchaseInvoiceResponse> getBySupplierNumber(
            @PathVariable String supplierNumber,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/supplier-number/{} - Fetch by supplier number", supplierNumber);
        PurchaseInvoiceResponse response = purchaseInvoiceService.getBySupplierInvoiceNumber(supplierNumber, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all unpaid purchase invoices.
     */
    @GetMapping("/unpaid")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getUnpaid(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/unpaid - Fetch all unpaid invoices");
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getUnpaid(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get unpaid invoices from supplier.
     */
    @GetMapping("/supplier/{supplierId}/unpaid")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getUnpaidBySupplier(
            @PathVariable UUID supplierId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/supplier/{}/unpaid", supplierId);
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getUnpaidBySupplierId(supplierId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get invoices by date range.
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/date-range - Fetch between {} and {}", startDate, endDate);
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getByDateRange(startDate, endDate, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get all invoices with withholding taxes.
     */
    @GetMapping("/with-withholding")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getWithWithholding(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/purchase-invoices/with-withholding - Fetch invoices with withholding");
        List<PurchaseInvoiceResponse> responses = purchaseInvoiceService.getWithWithholding(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update a purchase invoice.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseInvoiceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePurchaseInvoiceRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/purchase-invoices/{} - Update invoice", id);
        PurchaseInvoiceResponse response = purchaseInvoiceService.update(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Update retention percentage.
     */
    @PutMapping("/{id}/retention")
    public ResponseEntity<PurchaseInvoiceResponse> updateRetention(
            @PathVariable UUID id,
            @RequestParam BigDecimal percentage,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/purchase-invoices/{}/retention - Update retention to {}%", id, percentage);
        PurchaseInvoiceResponse response = purchaseInvoiceService.updateRetention(id, percentage, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a purchase invoice.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseInvoiceResponse> cancel(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/purchase-invoices/{}/cancel - Cancel invoice", id);
        PurchaseInvoiceResponse response = purchaseInvoiceService.cancel(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a purchase invoice.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("DELETE /api/purchase-invoices/{} - Delete invoice", id);
        purchaseInvoiceService.delete(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
