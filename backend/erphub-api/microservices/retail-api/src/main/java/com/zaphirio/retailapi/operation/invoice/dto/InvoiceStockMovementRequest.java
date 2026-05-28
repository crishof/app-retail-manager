package com.zaphirio.retailapi.operation.invoice.dto;

import com.zaphirio.retailapi.operation.invoice.model.StockMovementReason;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceStockMovementRequest {

    private UUID productId;
    private UUID branchId;
    private UUID locationId;
    private int quantity;
    private StockMovementReason reason;
    private UUID referenceId;
}
