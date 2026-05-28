package com.zaphirio.retailapi.operation.sales.apiClient;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementRequest {
    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private String reason;
    private UUID referenceId;
}
