package com.zaphirio.retailapi.operation.invoice.controller;

import com.zaphirio.retailapi.operation.invoice.dto.InvoiceRequest;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceResponse;
import com.zaphirio.retailapi.operation.invoice.dto.TransactionResponse;
import com.zaphirio.retailapi.operation.invoice.dto.AccountMovementResponse;
import com.zaphirio.retailapi.operation.invoice.dto.SupplierPaymentRequest;
import com.zaphirio.retailapi.operation.invoice.dto.SupplierPaymentResponse;
import com.zaphirio.retailapi.operation.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<InvoiceResponse>> getAll() {
        return ResponseEntity.ok(invoiceService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse save(@Valid @RequestBody InvoiceRequest invoiceRequest) {
        return invoiceService.save(invoiceRequest);
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<InvoiceResponse>> getBySupplierId(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(invoiceService.getAllBySupplierId(supplierId));
    }

    @GetMapping("/supplier/{supplierId}/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<TransactionResponse>> getTransactionsBySupplierId(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(invoiceService.getAllTransactionsBySupplier(supplierId));
    }

    @GetMapping("/supplier/{supplierId}/account")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<AccountMovementResponse>> getAccountStatement(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(invoiceService.getAccountStatement(supplierId));
    }

    @PostMapping("/supplier/{supplierId}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierPaymentResponse savePayment(@PathVariable UUID supplierId,
                                               @Valid @RequestBody SupplierPaymentRequest request) {
        request.setSupplierId(supplierId);
        return invoiceService.savePayment(request);
    }
}
