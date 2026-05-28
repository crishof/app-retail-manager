package com.zaphirio.retailapi.inventory.dto;

import com.zaphirio.retailapi.inventory.model.StockMovementReason;
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

    private int quantity; // + o -

    private StockMovementReason reason;

    private UUID referenceId; // invoiceId, orderId, transferId
}