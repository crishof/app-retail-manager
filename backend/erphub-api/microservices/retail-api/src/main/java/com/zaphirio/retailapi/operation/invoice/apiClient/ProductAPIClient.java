package com.zaphirio.retailapi.operation.invoice.apiClient;

import com.zaphirio.retailapi.operation.invoice.dto.InvoiceUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "product-sv", url = "http://localhost:9001")
public interface ProductAPIClient {

    @PutMapping("/product/invoice")
    String updateProductStockAndPrices(@RequestBody InvoiceUpdateRequest invoiceUpdateRequest);
}
