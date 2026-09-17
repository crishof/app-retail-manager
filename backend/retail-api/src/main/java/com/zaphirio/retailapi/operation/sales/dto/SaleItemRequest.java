package com.zaphirio.retailapi.operation.sales.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItemRequest {
    private UUID id;
    private double price;
    private int quantity;
    private double discountRate;
    private double taxRate;
}
