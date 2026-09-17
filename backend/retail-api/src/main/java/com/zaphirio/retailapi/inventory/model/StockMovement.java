package com.zaphirio.retailapi.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_stock_movements", indexes = {
        @Index(name = "idx_movement_product", columnList = "productId"),
        @Index(name = "idx_movement_stock", columnList = "stockId"),
        @Index(name = "idx_movement_reference", columnList = "referenceId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID stockId;
    private UUID productId;
    private UUID branchId;
    private UUID locationId;

    private int quantity; // + o -

    @Enumerated(EnumType.STRING)
    private StockMovementReason reason;

    private UUID referenceId; // invoiceId, orderId, transferId

    private Instant createdAt;
}