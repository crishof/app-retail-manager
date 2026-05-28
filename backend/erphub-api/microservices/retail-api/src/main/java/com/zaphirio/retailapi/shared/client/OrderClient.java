package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.party.customer.dto.ReassignCustomerResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(
        name = "retail-api",
        contextId = "orderClient", path = "/api/v1/orders")
public interface OrderClient {

    @GetMapping("/customer/{customerId}/exists")
    Boolean hasOrdersForCustomer(@PathVariable UUID customerId);

    @PatchMapping("/customer")
    ReassignCustomerResponse replaceCustomer(@RequestParam UUID customerId, @RequestParam UUID targetCustomerId);

    @GetMapping("/product/{productId}/exists")
    boolean hasOrdersForProduct(@PathVariable UUID productId);
}