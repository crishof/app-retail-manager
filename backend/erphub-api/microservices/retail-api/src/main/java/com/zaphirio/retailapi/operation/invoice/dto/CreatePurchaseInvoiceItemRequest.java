package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;

import java.util.UUID;

/**
 * Create Purchase Invoice Item Request DTO.
 * Represents a line item being added to a purchase invoice.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreatePurchaseInvoiceItemRequest {

    private UUID productId;

    @NotEmpty(message = "Item description is required")
    private String description;

    @Positive(message = "Quantity must be positive")
    private double quantity;

    @Positive(message = "Unit price must be positive")
    private double unitPrice;

    @Min(value = 0, message = "Discount percentage cannot be negative")
    private double discountPercentage = 0;

    @NotNull(message = "Tax rate is required (0, 7, or 21)")
    private String taxRate;

    @Min(value = 0, message = "Order index cannot be negative")
    private Integer orderIndex;
}
