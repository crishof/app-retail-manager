package com.zaphirio.retailapi.catalog.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingPriceResponse {

    private UUID id;
    private String type;
    private String name;
    private BigDecimal amount;
    private BigDecimal taxRate;
    private BigDecimal discountRate;
    private boolean active;
}
