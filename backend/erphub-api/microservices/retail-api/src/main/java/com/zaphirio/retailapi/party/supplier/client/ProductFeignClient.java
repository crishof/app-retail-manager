package com.zaphirio.retailapi.party.supplier.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "product-sv",
        url = "http://product-sv:8080"
)
public interface ProductFeignClient {

    @GetMapping("/internal/products/supplier/{id}/exist")
    Boolean existsProductsBySupplier(@PathVariable("id") UUID id);
}