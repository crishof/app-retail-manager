package com.zaphirio.retailapi.shared.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(
        contextId = "categoryClient",
        name = "retail-api", path = "/internal/categories")
public interface CategoryClient {

    @GetMapping("/getByNameOrCreate")
    UUID getIdOrCreate(@RequestParam String categoryName);
}