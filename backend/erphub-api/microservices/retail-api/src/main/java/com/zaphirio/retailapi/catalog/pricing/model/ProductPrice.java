package com.zaphirio.retailapi.catalog.pricing.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tbl_product_prices",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"product_id", "price_list_id"})
        }
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID productId;
    private UUID priceListId;

    private BigDecimal price;
    private BigDecimal taxRate;
    private BigDecimal discountRate;

    private Instant validFrom;
    private Instant validTo;
}