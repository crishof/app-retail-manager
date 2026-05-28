package com.zaphirio.retailapi.party.supplier.controller;

import com.zaphirio.retailapi.party.supplier.dto.SupplierRequest;
import com.zaphirio.retailapi.party.supplier.dto.SupplierResponse;
import com.zaphirio.retailapi.party.supplier.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Suppliers", description = "Suppliers managment APIs")
@Validated
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Slf4j
public class SupplierController {

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public String status() {
        return "Supplier service is running!";
    }

    private final SupplierService supplierService;

    // ============================
    // CREATE SUPPLIER
    // ============================
    @Operation(summary = "Create a new supplier")
    @ApiResponse(responseCode = "201", description = "Supplier created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SupplierResponse> create(
            @RequestBody SupplierRequest supplierRequest) {
        log.info("Creating supplier: {}", supplierRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(supplierService.create(supplierRequest));
    }

    // ============================
    // GET ALL SUPPLIERS
    // ============================
    @Operation(summary = "Get All Suppliers")
    @ApiResponse(responseCode = "200", description = "Suppliers retrieved successfully")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<SupplierResponse>> getSuppliers() {
        log.info("Fetching all suppliers");
        return ResponseEntity.ok(supplierService.findAll());
    }

    // ============================
    // GET SUPPLIER BY ID
    // ============================
    @Operation(summary = "Get Supplier by ID")
    @ApiResponse(responseCode = "200", description = "Supplier retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Supplier not found")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<SupplierResponse> getSupplierById(@PathVariable UUID id) {
        log.info("Fetching Supplier by ID: {}", id);
        return ResponseEntity.ok(supplierService.findById(id));
    }

    // ============================
    // GET SUPPLIER BY NAME
    // ============================
    //TODO implement get by name containing


    // ============================
    // UPDATE SUPPLIER
    // ============================
    @Operation(summary = "Update existing supplier")
    @ApiResponse(responseCode = "200", description = "Supplier updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "404", description = "Supplier not found")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable UUID id,
            @RequestBody SupplierRequest supplierRequest) {
        log.info("Updating supplier: {}", supplierRequest);
        return ResponseEntity.ok(supplierService.update(id, supplierRequest));
    }

    // ============================
    // SOFT DELETE SUPPLIER
    // ============================
    @Operation(summary = "Soft delete a supplier by ID")
    @ApiResponse(responseCode = "204", description = "Brand deleted successfully")
    @ApiResponse(responseCode = "404", description = "Brand not found")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> softDelete(@PathVariable UUID id) {
        log.info("Soft deleting supplier by ID: {}", id);
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // FORCE DELETE SUPPLIER
    // ============================
    @Operation(summary = "Hard delete a supplier by ID")
    @ApiResponse(responseCode = "204", description = "Supplier deleted successfully")
    @ApiResponse(responseCode = "404", description = "Supplier not found")
    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> forceDelete(@PathVariable @NotNull UUID id) {
        log.info("Hard deleting supplier id={}", id);
        supplierService.forceDelete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // RESTORE SUPPLIER
    // ============================
    @Operation(summary = "Restore a soft-deleted supplier by ID")
    @ApiResponse(responseCode = "200", description = "Supplier restored successfully")
    @ApiResponse(responseCode = "404", description = "Supplier not found")
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SupplierResponse> restore(@PathVariable @NotNull UUID id) {
        log.info("Restoring supplier id={}", id);
        return ResponseEntity.ok(supplierService.restore(id));
    }

    // ============================
    // COUNT SUPPLIERS
    // ============================
    @Operation(summary = "Get total count of suppliers")
    @ApiResponse(responseCode = "200", description = "Supplier count retrieved successfully")
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Long> getSupplierCount() {
        log.info("Getting total count of suppliers");
        return ResponseEntity.ok(supplierService.getSupplierCount());
    }
}
