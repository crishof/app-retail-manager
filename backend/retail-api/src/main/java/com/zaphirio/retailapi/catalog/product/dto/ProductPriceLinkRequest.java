package com.zaphirio.retailapi.catalog.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPriceLinkRequest {

    @NotBlank
    private String supplierProductId;

    @NotNull
    private String productId;

    private String supplierCode;

    private BigDecimal lastImportedPrice;
}
