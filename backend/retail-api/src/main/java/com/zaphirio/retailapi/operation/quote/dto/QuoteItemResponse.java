package com.zaphirio.retailapi.operation.quote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Quote Item Response DTO.
 * Used for returning quote item data to API clients.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class QuoteItemResponse {

    private UUID id;
    private UUID productId;
    private String description;

    private double quantity;
    private double unitPrice;
    private double discountPercentage;
    private String taxRate;

    private double lineTotal;
    private double lineTotalWithTax;
    private Integer orderIndex;
}
