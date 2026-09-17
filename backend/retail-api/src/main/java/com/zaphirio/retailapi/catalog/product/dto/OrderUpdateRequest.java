package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class OrderUpdateRequest {

    private UUID branchId;
    private UUID locationId;
    private List<SupplierInvoiceItem> invoiceItems;
}