package com.zaphirio.retailapi.operation.sales.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItemResponse {
    private UUID productId;
    private double price;
    private int quantity;
    private double discountRate;
    private double taxRate;
}
