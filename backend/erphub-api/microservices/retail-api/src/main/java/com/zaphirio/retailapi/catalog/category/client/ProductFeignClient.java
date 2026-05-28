package com.zaphirio.retailapi.catalog.category.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "product-sv",
        url = "http://product-sv:8080"
)
public interface ProductFeignClient {

    @PatchMapping("/internal/products/category/{categoryId}/clear")
    Integer clearCategory(@PathVariable("categoryId") UUID categoryId);
}