package com.zaphirio.retailapi.catalog.product.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockResponse {
    private UUID id;
    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private Integer max;
    private Integer min;
}
