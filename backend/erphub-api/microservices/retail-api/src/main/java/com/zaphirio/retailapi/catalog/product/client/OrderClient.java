// OrderClient (Feign interface)
package com.zaphirio.retailapi.catalog.product.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "order-sv", path = "/internal/orders")
public interface OrderClient {

    @GetMapping("/product/{productId}/exists")
    boolean hasOrdersForProduct(@PathVariable UUID productId);
}