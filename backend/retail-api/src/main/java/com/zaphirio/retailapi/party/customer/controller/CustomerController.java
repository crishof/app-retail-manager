package com.zaphirio.retailapi.party.customer.controller;

import com.zaphirio.retailapi.party.customer.dto.CustomerMergeResponse;
import com.zaphirio.retailapi.party.customer.dto.CustomerRequest;
import com.zaphirio.retailapi.party.customer.dto.CustomerResponse;
import com.zaphirio.retailapi.party.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Customers", description = "Customer management APIs")
@Validated
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerService customerService;

    // ============================
    // CREATE CUSTOMER
    // ============================
    @Operation(summary = "Create a new customer")
    @ApiResponse(responseCode = "201", description = "Customer created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public CustomerResponse create(@RequestBody CustomerRequest customerRequest) {
        log.info("Creating customer : {}", customerRequest);
        return customerService.create(customerRequest);
    }

    // ============================
    // SEARCH CUSTOMERS
    // ============================
    @Operation(summary = "Search customers by term")
    @ApiResponse(responseCode = "200", description = "Customers found successfully")
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<CustomerResponse>> search(@RequestParam String search) {
        log.info("Searching customers with term: {}", search);
        return ResponseEntity.ok(customerService.search(search));
    }

    // ============================
    // GET ALL CUSTOMERS (PAGINATED)
    // ============================
    @Operation(summary = "Get all customers")
    @ApiResponse(responseCode = "200", description = "Customers retrieved successfully")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Page<CustomerResponse>> getAll(Pageable pageable) {
        log.info("Fetching all customers with pagination");
        Page<CustomerResponse> page = customerService.getAll(pageable);
        return ResponseEntity.ok(page);
    }

    // ============================
    // GET CUSTOMER BY ID
    // ============================
    @Operation(summary = "Get customer by ID")
    @ApiResponse(responseCode = "200", description = "Customer retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<CustomerResponse> getById(@PathVariable @NotNull UUID id) {
        log.info("Fetching a customer by ID {}", id);
        return ResponseEntity.ok(customerService.getById(id));
    }

    // ============================
    // UPDATE CUSTOMER
    // ============================
    @Operation(summary = "Update an existing customer")
    @ApiResponse(responseCode = "200", description = "Customer updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CustomerResponse> update(@PathVariable @NotNull UUID id, @RequestBody CustomerRequest customerRequest) {
        return ResponseEntity.ok(customerService.update(id, customerRequest));
    }

    // ============================
    // SOFT DELETE CUSTOMER
    // ============================
    @Operation(summary = "Soft delete a customer by ID")
    @ApiResponse(responseCode = "204", description = "Customer deleted successfully")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @NotNull UUID id) {
        log.info("Soft deleting a customer by ID {}", id);
        customerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // FORCE DELETE BRAND
    // ============================
    @Operation(summary = "Hard delete a customer by ID")
    @ApiResponse(responseCode = "204", description = "Customer deleted successfully")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> forceDelete(@PathVariable @NotNull UUID id) {
        log.info("Hard deleting customer id={}", id);
        customerService.forceDelete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // RESTORE CUSTOMER
    // ============================
    @Operation(summary = "Restore a deleted customer by ID")
    @ApiResponse(responseCode = "200", description = "Customer restored successfully")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CustomerResponse> restore(@PathVariable @NotNull UUID id) {
        log.info("Restoring customer id={}", id);
        return ResponseEntity.ok(customerService.restore(id));
    }

    // ============================
    // COUNT CUSTOMERS
    // ============================
    @Operation(summary = "Get total number of customers")
    @ApiResponse(responseCode = "200", description = "Customer count retrieved successfully")
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Long> getCustomerCount() {
        log.info("Getting total count of customers");
        return ResponseEntity.ok(customerService.getCustomerCount());
    }

    // ============================
    // MERGE CUSTOMERS
    // ============================
    @Operation(summary = "Merge a customer into another one", description = """
            Reassigns all purchases to the target customer and deletes the source.
            This operation is irreversible""")
    @ApiResponse(responseCode = "200", description = "Customers merged successfully")
    @ApiResponse(responseCode = "404", description = "Customer not found")
    @ApiResponse(responseCode = "400", description = "Invalid customer merge request")
    @PutMapping("/{id}/merge")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerMergeResponse> mergeCustomerInto(@PathVariable @NotNull UUID id, @RequestParam @NotNull UUID targetCustomerId) {

        //TODO test with orders created
        return ResponseEntity.ok(customerService.mergeCustomerInto(id, targetCustomerId));
    }
}
