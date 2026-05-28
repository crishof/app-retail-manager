package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class StockMovementRequest {

    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private StockMovementType type;
    private String reference;
}