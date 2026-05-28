package com.zaphirio.retailapi.catalog.product.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(
        name = "brand-sv",
        path = "/internal/brands"
)
public interface BrandClient {

    @GetMapping("/getByNameOrCreate")
    UUID getIdOrCreate(@RequestParam("brandName") String brandName);
}