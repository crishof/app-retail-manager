package com.zaphirio.retailapi.operation.quote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Create Quote Item Request DTO.
 * Used for creating quote line items.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateQuoteItemRequest {

    private UUID productId;
    private String description;

    private double quantity;
    private double unitPrice;
    private double discountPercentage;
    private String taxRate;

    private Integer orderIndex;
}
