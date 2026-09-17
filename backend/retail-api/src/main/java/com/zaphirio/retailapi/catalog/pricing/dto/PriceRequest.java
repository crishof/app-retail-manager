package com.zaphirio.retailapi.catalog.pricing.dto;

import com.zaphirio.retailapi.catalog.pricing.model.PriceType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceRequest {

    private UUID productId;

    private PriceType type;

    @NotBlank
    private String name;

    private BigDecimal amount;

    private BigDecimal taxRate;
    private BigDecimal discountRate;
}