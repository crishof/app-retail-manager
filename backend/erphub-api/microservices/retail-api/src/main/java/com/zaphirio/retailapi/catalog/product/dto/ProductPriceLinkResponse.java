package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class ProductPriceLinkResponse {

    UUID id;
    String supplierProductId;
    UUID productId;
    String productName;
    String supplierCode;
    BigDecimal lastImportedPrice;
    String priceChangeStatus;
    BigDecimal previousImportedPrice;
    LocalDateTime lastPriceChangeAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
