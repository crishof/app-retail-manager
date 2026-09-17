package com.zaphirio.retailapi.catalog.pricing.dto;

import com.zaphirio.retailapi.catalog.pricing.model.PriceType;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PriceResponse {

    private UUID id;
    private PriceType type;
    private String name;
    private BigDecimal amount;
    private BigDecimal taxRate;
    private BigDecimal discountRate;
    private boolean active;
}