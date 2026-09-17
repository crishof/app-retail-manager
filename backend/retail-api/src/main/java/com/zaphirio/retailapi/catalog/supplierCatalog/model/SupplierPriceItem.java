package com.zaphirio.retailapi.catalog.supplierCatalog.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tbl_supplier_price_item",
        indexes = {
                @Index(name = "idx_supplier_price_supplier", columnList = "supplier_id"),
                @Index(name = "idx_supplier_price_code", columnList = "supplier_code")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierPriceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    // =========================
    // RELACIÓN
    // =========================
    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    // =========================
    // IDENTIFICACIÓN DEL ÍTEM
    // =========================
    @Column(name = "supplier_code", nullable = false, length = 100)
    private String supplierCode;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model", length = 150)
    private String model;

    @Column(name = "barcode", length = 100)
    private String barcode;

    // =========================
    // DESCRIPCIÓN
    // =========================
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "category", length = 150)
    private String category;

    // =========================
    // PRECIOS
    // =========================
    @Column(name = "price", nullable = false, precision = 15, scale = 4)
    private BigDecimal price;

    @Column(name = "suggested_price", precision = 15, scale = 4)
    private BigDecimal suggestedPrice;

    @Column(name = "suggested_web_price", precision = 15, scale = 4)
    private BigDecimal suggestedWebPrice;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "tax_rate", precision = 5, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "internal_tax",  precision = 5, scale = 4)
    private BigDecimal internalTax;

    // =========================
    // STOCK
    // =========================
    @Column(name = "stock_raw", length = 50)
    private String stockRaw;// "> 10", "NO", "< 5"

    // =========================
    // FECHA DE ACTUALIZACIÓN
    // =========================
    @Column(name = "last_update", nullable = false)
    private Instant lastUpdate;
}
