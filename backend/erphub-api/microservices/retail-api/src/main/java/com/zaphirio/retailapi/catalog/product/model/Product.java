package com.zaphirio.retailapi.catalog.product.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SoftDelete;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tbl_products", indexes = {
        @Index(name = "idx_product_code", columnList = "code"),
        @Index(name = "idx_product_brand", columnList = "brandId"),
        @Index(name = "idx_product_category", columnList = "categoryId"),
        @Index(name = "idx_product_active", columnList = "active")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SoftDelete
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 100)
    private String code;

    @Column(nullable = false)
    private UUID brandId;

    @Column(nullable = false)
    String brandName;

    @Column(nullable = false, length = 150)
    private String model;

    @Column(length = 1000)
    private String description;

    private UUID categoryId;

    private UUID dimensionId;

    private UUID supplierId;

    private UUID supplierProductId;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean published = false;

    @Column(nullable = false)
    private boolean highlighted = false;

    @ElementCollection
    @CollectionTable(
            name = "tbl_product_images",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "image_url", nullable = false)
    private List<String> imageUrls = new ArrayList<>();

    private UUID priceId;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant updatedAt;

    // ----------- Commercial codes -----------

    @Column( unique = true, length = 100)
    private String sku;     // Internal code

    @Column(length = 14)
    private String gtin;    // Global Trade Item Number

    @Column(length = 13)
    private String ean;   // European Article Number (EAN-13)

    @Column(length = 12)
    private String upc;     // Mainly USA

    @Column(length = 13)
    private String isbn;    // International Standard Book Number

    @Column(length = 20)
    private String mpn;     // Manufacturer Part Number

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}