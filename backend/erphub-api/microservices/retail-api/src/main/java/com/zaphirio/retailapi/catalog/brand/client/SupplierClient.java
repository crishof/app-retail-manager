package com.zaphirio.retailapi.catalog.brand.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "supplier-sv")
public interface SupplierClient {

    @GetMapping("/api/v1/suppliers/status")
    String status();
}
