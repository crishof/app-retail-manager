package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceClient {

    private final InvoiceClient invoiceClient;

    public boolean hasInvoicesForProduct(UUID productId) {
        try {
            return invoiceClient.hasInvoicesForProduct(productId);
        } catch (Exception e) {
            log.error("Error calling invoice-sv for product {}", productId, e);
            throw new BusinessException("Failed to verify invoices for product");
        }
    }
}