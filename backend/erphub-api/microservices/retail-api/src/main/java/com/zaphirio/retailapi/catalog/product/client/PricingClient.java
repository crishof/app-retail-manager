// PricingClient (Feign interface)
package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.catalog.product.dto.CreateSnapshotPriceRequest;
import com.zaphirio.retailapi.catalog.product.dto.PricingPriceResponse;
import com.zaphirio.retailapi.catalog.product.dto.PriceRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "pricing-sv", path = "/internal/pricing")
public interface PricingClient {

    @PostMapping("/snapshot")
    UUID createSnapshot(@RequestBody CreateSnapshotPriceRequest request);

    @PutMapping("/{priceId}")
    void update(@PathVariable UUID priceId, @RequestBody PriceRequest request);

    @GetMapping("/product/{productId}")
    List<PricingPriceResponse> getProductPrices(@PathVariable UUID productId);
}