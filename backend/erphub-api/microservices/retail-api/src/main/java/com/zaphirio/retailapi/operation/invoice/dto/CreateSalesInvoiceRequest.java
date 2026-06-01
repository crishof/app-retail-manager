package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Create Sales Invoice Request DTO.
 * Used for creating new sales invoices via API.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateSalesInvoiceRequest {

    @NotNull(message = "Sale ID is required")
    private UUID saleId;

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    private UUID locationId;

    @NotEmpty(message = "Invoice number is required")
    private String number;

    @NotEmpty(message = "Document type is required")
    private String documentType;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @Positive(message = "Total price must be positive")
    private double totalPrice;

    private String paymentMethod;
    private String observations;

    @NotEmpty(message = "Invoice must have at least one item")
    @Builder.Default
    private List<CreateSalesInvoiceItemRequest> items = new ArrayList<>();
}
