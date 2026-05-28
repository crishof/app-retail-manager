package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.brand.dto.ReassignBrandResponse;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
        name = "retail-api",
        contextId = "productClient")
public interface ProductAPIClient {

    @PutMapping("/product/invoice")
    String updateProductStockAndPrices(@RequestBody InvoiceUpdateRequest invoiceUpdateRequest);


    @GetMapping("/internal/products/brand/{brandId}/exists")
    Boolean hasProductsForBrand(@PathVariable UUID brandId);

    @PatchMapping("/internal/products/brand")
    ReassignBrandResponse replaceBrand(
            @RequestParam("brandId") UUID brandId,
            @RequestParam("newBrandId") UUID newBrandId
    );

    @GetMapping("/internal/products/supplier/{id}/exist")
    Boolean existsProductsBySupplier(@PathVariable UUID id);

    @PatchMapping("/internal/products/category/{categoryId}/clear")
    Integer clearCategory(@PathVariable UUID categoryId);
}
