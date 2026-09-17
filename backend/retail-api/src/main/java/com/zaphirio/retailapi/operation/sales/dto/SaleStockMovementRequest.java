package com.zaphirio.retailapi.operation.sales.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleStockMovementRequest {
    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private String reason;
    private UUID referenceId;
}
