package com.zaphirio.retailapi.operation.quote.controller;

import com.zaphirio.retailapi.operation.quote.dto.*;
import com.zaphirio.retailapi.operation.quote.service.QuoteService;
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
 * REST Controller for Quote operations.
 * Endpoints: GET, POST, PUT, DELETE for quotes and status transitions.
 */
@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Slf4j
public class QuoteController {

    private final QuoteService quoteService;

    /**
     * Create a new quote.
     */
    @PostMapping
    public ResponseEntity<QuoteResponse> create(
            @Valid @RequestBody CreateQuoteRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/quotes - Create new quote");
        QuoteResponse response = quoteService.create(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get quote by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponse> getById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/{} - Fetch quote", id);
        QuoteResponse response = quoteService.getById(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all quotes.
     */
    @GetMapping
    public ResponseEntity<List<QuoteResponse>> getAll(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes - Fetch all quotes");
        List<QuoteResponse> responses = quoteService.getAll(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get quotes by customer.
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<QuoteResponse>> getByCustomer(
            @PathVariable UUID customerId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/customer/{} - Fetch by customer", customerId);
        List<QuoteResponse> responses = quoteService.getByCustomerId(customerId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get quotes by customer and branch.
     */
    @GetMapping("/customer/{customerId}/branch/{branchId}")
    public ResponseEntity<List<QuoteResponse>> getByCustomerAndBranch(
            @PathVariable UUID customerId,
            @PathVariable UUID branchId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/customer/{}/branch/{} - Fetch by customer and branch", customerId, branchId);
        List<QuoteResponse> responses = quoteService.getByCustomerIdAndBranchId(customerId, branchId, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get quotes by status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<QuoteResponse>> getByStatus(
            @PathVariable String status,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/status/{} - Fetch by status", status);
        List<QuoteResponse> responses = quoteService.getByStatus(status, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get active quotes.
     */
    @GetMapping("/active")
    public ResponseEntity<List<QuoteResponse>> getActive(
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/active - Fetch active quotes");
        List<QuoteResponse> responses = quoteService.getActive(tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get quotes by date range.
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<QuoteResponse>> getByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/date-range - Fetch between {} and {}", startDate, endDate);
        List<QuoteResponse> responses = quoteService.getByDateRange(startDate, endDate, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get quotes expiring soon.
     */
    @GetMapping("/expiring")
    public ResponseEntity<List<QuoteResponse>> getExpiringQuotes(
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("GET /api/quotes/expiring - Fetch expiring in {} days", days);
        List<QuoteResponse> responses = quoteService.getExpiringQuotes(days, tenantId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Update a quote.
     */
    @PutMapping("/{id}")
    public ResponseEntity<QuoteResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQuoteRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("PUT /api/quotes/{} - Update quote", id);
        QuoteResponse response = quoteService.update(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Send a quote to customer (change status to SENT).
     */
    @PostMapping("/{id}/send")
    public ResponseEntity<QuoteResponse> sendQuote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/quotes/{}/send - Send quote to customer", id);
        QuoteResponse response = quoteService.sendQuote(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Accept a quote (change status to ACCEPTED).
     */
    @PostMapping("/{id}/accept")
    public ResponseEntity<QuoteResponse> acceptQuote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/quotes/{}/accept - Accept quote", id);
        QuoteResponse response = quoteService.acceptQuote(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a quote (change status to REJECTED).
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<QuoteResponse> rejectQuote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/quotes/{}/reject - Reject quote", id);
        QuoteResponse response = quoteService.rejectQuote(id, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Convert quote to sale.
     */
    @PostMapping("/{id}/convert-to-sale")
    public ResponseEntity<QuoteResponse> convertToSale(
            @PathVariable UUID id,
            @RequestParam UUID saleId,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("POST /api/quotes/{}/convert-to-sale - Convert quote to sale {}", id, saleId);
        QuoteResponse response = quoteService.convertToSale(id, saleId, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a quote.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = true) Long tenantId) {
        log.info("DELETE /api/quotes/{} - Delete quote", id);
        quoteService.delete(id, tenantId);
        return ResponseEntity.noContent().build();
    }
}
