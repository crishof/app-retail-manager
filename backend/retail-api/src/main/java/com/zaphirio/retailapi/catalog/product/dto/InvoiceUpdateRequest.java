package com.zaphirio.retailapi.catalog.product.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class InvoiceUpdateRequest {

    private UUID branchId;
    private UUID locationId;
    private List<SupplierInvoiceItem> invoiceItems;
}