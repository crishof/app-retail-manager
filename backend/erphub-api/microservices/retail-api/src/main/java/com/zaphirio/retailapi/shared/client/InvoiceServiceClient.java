package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.operation.invoice.service.InvoiceService;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceClient {

    private final InvoiceService invoiceService;

    public boolean hasInvoicesForProduct(UUID productId) {
        try {
            return invoiceService.hasInvoicesForProduct(productId);
        } catch (Exception e) {
            log.error("Error calling invoice service for product {}", productId, e);
            throw new BusinessException("Failed to verify invoices for product");
        }
    }
}