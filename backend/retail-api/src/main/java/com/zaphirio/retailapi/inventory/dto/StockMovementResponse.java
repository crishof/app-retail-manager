package com.zaphirio.retailapi.inventory.dto;

import com.zaphirio.retailapi.inventory.model.StockMovementReason;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementResponse {

    private UUID id;
    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private StockMovementReason reason;
    private UUID referenceId;
    private Instant createdAt;
}
