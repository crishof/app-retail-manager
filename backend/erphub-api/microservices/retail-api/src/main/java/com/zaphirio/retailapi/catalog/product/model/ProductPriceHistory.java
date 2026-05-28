package com.zaphirio.retailapi.catalog.product.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Historial de cambios de precio de un vínculo proveedor-producto.
 * Permite auditar todas las variaciones detectadas.
 */
@Entity
@Table(name = "tbl_product_price_history", indexes = {
    @Index(name = "idx_link_id", columnList = "link_id"),
    @Index(name = "idx_recorded_at", columnList = "recorded_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPriceHistory {

    @Id
    @GeneratedValue
    private UUID id;

    /** Referencia al vínculo. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "link_id", nullable = false)
    private ProductPriceLink link;

    /** Precio anterior. */
    @Column(precision = 10, scale = 2)
    private BigDecimal priceFrom;

    /** Precio nuevo. */
    @Column(precision = 10, scale = 2)
    private BigDecimal priceTo;

    /** Variación porcentual. */
    @Column(precision = 5, scale = 2)
    private BigDecimal changePercent;

    /** Tipo de cambio. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductPriceLink.PriceChangeStatus changeType;

    /** Fecha de importación que generó el cambio. */
    private LocalDateTime importedAt;

    /** Registrado en. */
    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    public void prePersist() {
        this.recordedAt = LocalDateTime.now();
        if (this.importedAt == null) {
            this.importedAt = LocalDateTime.now();
        }
    }
}
