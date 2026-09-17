package com.zaphirio.retailapi.catalog.product.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Relaciona un artículo del proveedor (SupplierProduct) con un producto propio (Product).
 * Rastrea cambios de precio importado en cada actualización.
 */
@Entity
@Table(name = "tbl_product_price_link", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"supplier_product_id", "product_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPriceLink {

    @Id
    @GeneratedValue
    private UUID id;

    /** ID del artículo en el catálogo del proveedor (supplier-product id). */
    @Column(nullable = false, length = 36)
    private String supplierProductId;

    /** Referencia al producto local. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Código del proveedor (del SupplierProduct importado). */
    @Column(length = 100)
    private String supplierCode;

    /** Precio más reciente importado desde el proveedor. */
    @Column(precision = 10, scale = 2)
    private BigDecimal lastImportedPrice;

    /** Estado del cambio de precio respecto a la importación anterior. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceChangeStatus priceChangeStatus;

    /** Precio anterior importado (para detectar cambios). */
    @Column(precision = 10, scale = 2)
    private BigDecimal previousImportedPrice;

    /** Fecha del último cambio detectado en precio. */
    private LocalDateTime lastPriceChangeAt;

    /** Creado en. */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Actualizado en. */
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.priceChangeStatus == null) {
            this.priceChangeStatus = PriceChangeStatus.NEW;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum PriceChangeStatus {
        NEW,      // Primera vez que se vincula
        SAME,     // Precio igual al anterior
        UP,       // Precio aumentó
        DOWN;     // Precio disminuyó

        public String label() {
            return switch (this) {
                case NEW -> "Nuevo vínculo";
                case SAME -> "Precio sin cambios";
                case UP -> "Precio subió";
                case DOWN -> "Precio bajó";
            };
        }
    }
}
