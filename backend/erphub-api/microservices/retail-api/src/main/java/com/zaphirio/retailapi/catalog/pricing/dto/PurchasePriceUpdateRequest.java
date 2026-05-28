package com.zaphirio.retailapi.catalog.pricing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchasePriceUpdateRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private BigDecimal purchasePrice;

    private BigDecimal taxRate;
    private BigDecimal discountRate;
}