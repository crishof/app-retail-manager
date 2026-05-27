package com.zaphirio.retailapi.catalog.brand.client;

import com.zaphirio.retailapi.catalog.brand.dto.ReassignBrandResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
        name = "product-sv",
        url = "http://product-sv:8080"
)
public interface ProductFeignClient {

    @GetMapping("/internal/products/brand/{brandId}/exists")
    Boolean hasProductsForBrand(@PathVariable UUID brandId);

    @PatchMapping("/internal/products/brand")
    ReassignBrandResponse replaceBrand(
            @RequestParam("brandId") UUID brandId,
            @RequestParam("newBrandId") UUID newBrandId
    );
}