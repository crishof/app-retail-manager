package com.zaphirio.retailapi.shared.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "retail-api",
        contextId = "supplierClient")

public interface SupplierClient {

    @GetMapping("/api/v1/suppliers/status")
    String status();
}
