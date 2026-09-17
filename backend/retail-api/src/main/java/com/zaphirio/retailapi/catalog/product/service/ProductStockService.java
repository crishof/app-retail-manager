package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.catalog.product.dto.InvoiceUpdateRequest;
import com.zaphirio.retailapi.catalog.product.dto.OrderUpdateRequest;
import jakarta.transaction.Transactional;

public interface ProductStockService {
    @Transactional
    void updateFromInvoice(InvoiceUpdateRequest request);

    @Transactional
    void updateFromOrder(OrderUpdateRequest request);
}
