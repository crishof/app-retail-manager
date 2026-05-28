package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class ProductPriceHistoryResponse {

    UUID id;
    UUID linkId;
    BigDecimal priceFrom;
    BigDecimal priceTo;
    BigDecimal changePercent;
    String changeType;
    LocalDateTime importedAt;
    LocalDateTime recordedAt;
}
