package com.zaphirio.retailapi.operation.invoice.controller;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.service.SalesInvoiceService;
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
 * REST Controller for Sales Invoice operations.
 * Endpoints: GET, POST, PUT, DELETE for sales invoices and payments.
 */
@RestController
@RequestMapping("/api/v1/sales-invoices")
@RequiredArgsConstructor
@Slf4j
public class SalesInvoiceController {

    private final SalesInvoiceService salesInvoiceService;

    /**
     * Create a new sales invoice.
     */
    @PostMapping
    public ResponseEntity<SalesInvoiceResponse> create(
            @Valid @RequestBody CreateSalesInvoiceRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/sales-invoices - Create new sales invoice");
        SalesInvoiceResponse response = salesInvoiceService.create(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get sales invoice by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SalesInvoiceResponse> getById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices/{} - Fetch invoice", id);
        SalesInvoiceResponse response = salesInvoiceService.getById(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all sales invoices.
     */
    @GetMapping
    public ResponseEntity<List<SalesInvoiceResponse>> getAll(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices - Fetch all invoices");
        List<SalesInvoiceResponse> responses = salesInvoiceService.getAll(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get sales invoices by customer.
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SalesInvoiceResponse>> getByCustomer(
            @PathVariable UUID customerId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices/customer/{} - Fetch by customer", customerId);
        List<SalesInvoiceResponse> responses = salesInvoiceService.getByCustomerId(customerId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get sales invoice by sale ID.
     */
    @GetMapping("/sale/{saleId}")
    public ResponseEntity<SalesInvoiceResponse> getBySaleId(
            @PathVariable UUID saleId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices/sale/{} - Fetch by sale", saleId);
        SalesInvoiceResponse response = salesInvoiceService.getBySaleId(saleId, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get unpaid invoices for customer.
     */
    @GetMapping("/customer/{customerId}/unpaid")
    public ResponseEntity<List<SalesInvoiceResponse>> getUnpaidByCustomer(
            @PathVariable UUID customerId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices/customer/{}/unpaid", customerId);
        List<SalesInvoiceResponse> responses = salesInvoiceService.getUnpaidByCustomerId(customerId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get invoices by date range.
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<SalesInvoiceResponse>> getByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/v1/sales-invoices/date-range - Fetch between {} and {}", startDate, endDate);
        List<SalesInvoiceResponse> responses = salesInvoiceService.getByDateRange(startDate, endDate, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update a sales invoice.
     */
    @PutMapping("/{id}")
    public ResponseEntity<SalesInvoiceResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSalesInvoiceRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/v1/sales-invoices/{} - Update invoice", id);
        SalesInvoiceResponse response = salesInvoiceService.update(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Record a payment for a sales invoice.
     */
    @PostMapping("/{id}/payments")
    public ResponseEntity<SalesInvoiceResponse> recordPayment(
            @PathVariable UUID id,
            @RequestParam double amount,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/sales-invoices/{}/payments - Record payment of {}", id, amount);
        SalesInvoiceResponse response = salesInvoiceService.recordPayment(id, amount, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a sales invoice.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<SalesInvoiceResponse> cancel(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/v1/sales-invoices/{}/cancel - Cancel invoice", id);
        SalesInvoiceResponse response = salesInvoiceService.cancel(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a sales invoice.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("DELETE /api/v1/sales-invoices/{} - Delete invoice", id);
        salesInvoiceService.delete(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
