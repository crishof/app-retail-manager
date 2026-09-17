package com.zaphirio.retailapi.catalog.pricing.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_prices", uniqueConstraints = {@UniqueConstraint(columnNames = {"product_id", "type", "name"})}, indexes = {@Index(name = "idx_price_product", columnList = "product_id"), @Index(name = "idx_price_type", columnList = "type"), @Index(name = "idx_price_active", columnList = "active")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Price {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceType type;

    @Column(nullable = false, length = 50)
    private String name; // "Lista", "Web", "Black Friday", etc

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountRate;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
        active = true;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}