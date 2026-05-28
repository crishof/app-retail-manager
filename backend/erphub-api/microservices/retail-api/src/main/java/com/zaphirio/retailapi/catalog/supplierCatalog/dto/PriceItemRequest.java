package com.zaphirio.retailapi.catalog.supplierCatalog.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PriceItemRequest {

    private UUID supplierId;
    private String supplierCode;
    private String brand;
    private String model;
    private String barcode;
    private String description;
    private String category;
    private BigDecimal price;
    private BigDecimal suggestedPrice;
    private BigDecimal suggestedWebPrice;
    private String currency;
    private BigDecimal taxRate;
    private String stockAvailable;
    private Instant lastUpdate;
}
