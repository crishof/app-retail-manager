package com.zaphirio.retailapi.catalog.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class PriceRequest {

    private double purchasePrice;
    private double taxRate;
    private Double discountRate;
    private UUID productId;
}