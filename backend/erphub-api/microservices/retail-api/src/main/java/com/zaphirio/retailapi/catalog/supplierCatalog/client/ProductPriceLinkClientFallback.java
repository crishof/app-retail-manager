package com.zaphirio.retailapi.catalog.supplierCatalog.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ProductPriceLinkClientFallback implements ProductPriceLinkClient {

    @Override
    public void notifyPriceUpdate(PriceUpdateRequest request) {
        log.warn("product-sv unavailable — price update notification skipped | supplierProductId={}", request.supplierProductId());
    }
}
