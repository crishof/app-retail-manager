// InvoiceClient (Feign interface)
package com.zaphirio.retailapi.catalog.product.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "invoice-sv", path = "/internal/invoices")
public interface InvoiceClient {

    @GetMapping("/product/{productId}/exists")
    boolean hasInvoicesForProduct(@PathVariable UUID productId);
}