package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Purchase Invoice Item Response DTO.
 * Represents a line item in a purchase invoice response.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PurchaseInvoiceItemResponse {

    private UUID id;
    private UUID productId;
    private String description;
    private double quantity;
    private double unitPrice;
    private double discountPercentage;
    private String taxRate;
    private double lineTotal;
    private double taxAmount;
    private double lineTotalWithTax;
    private double unitCostWithTax;
    private Integer orderIndex;
}
