package com.zaphirio.retailapi.catalog.supplierCatalog.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;

@FeignClient(name = "product-sv", fallback = ProductPriceLinkClientFallback.class)
public interface ProductPriceLinkClient {

    @PatchMapping("/api/v1/product-price-links/price-update")
    void notifyPriceUpdate(@RequestBody PriceUpdateRequest request);

    record PriceUpdateRequest(String supplierProductId, BigDecimal newPrice) {}
}
