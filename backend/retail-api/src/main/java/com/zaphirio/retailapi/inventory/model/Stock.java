package com.zaphirio.retailapi.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_stocks", uniqueConstraints = @UniqueConstraint(
        columnNames = {"product_id", "branch_id", "location_id"}),
        indexes = {
        @Index(name = "idx_stock_product", columnList = "product_id"),
        @Index(name = "idx_stock_branch", columnList = "branch_id"),
        @Index(name = "idx_stock_location", columnList = "location_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private UUID branchId;

    @Column(nullable = false)
    private UUID locationId;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;

    public void applyMovement(int delta) {
        this.quantity += delta;
        this.updatedAt = Instant.now();
    }
}