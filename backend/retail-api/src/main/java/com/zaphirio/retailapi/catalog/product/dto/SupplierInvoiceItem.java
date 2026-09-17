package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SupplierInvoiceItem {

    private UUID productId;
    private int quantity;
    private double price;
    private double taxRate;
    private Double discountRate;
}