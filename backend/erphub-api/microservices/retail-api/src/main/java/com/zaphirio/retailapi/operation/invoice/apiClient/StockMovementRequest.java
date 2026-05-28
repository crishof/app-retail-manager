package com.zaphirio.retailapi.operation.invoice.apiClient;

import com.zaphirio.retailapi.operation.invoice.model.StockMovementReason;
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
    private StockMovementReason reason;
    private UUID referenceId;
}
