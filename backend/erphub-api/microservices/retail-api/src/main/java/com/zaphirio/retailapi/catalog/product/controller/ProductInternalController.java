package com.zaphirio.retailapi.catalog.product.controller;

import com.zaphirio.retailapi.catalog.product.dto.CategoryReplaceRequest;
import com.zaphirio.retailapi.catalog.product.dto.ReassignBrandResponse;
import com.zaphirio.retailapi.catalog.product.service.ProductService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/products")
@RequiredArgsConstructor
@Slf4j
@Hidden
public class ProductInternalController {

    private final ProductService productService;

    // ============================
    // HAS PRODUCTS BY BRAND
    // ============================
    @GetMapping("/brand/{brandId}/exists")
    public boolean hasProductsForBrand(@PathVariable UUID brandId) {
        log.info("Checking if products exist for brand {}", brandId);
        return productService.hasProductsForBrand(brandId);
    }

    // ============================
    // REPLACE PRODUCT BRAND
    // ============================
    @PatchMapping("/brand")
    public ReassignBrandResponse replaceBrand(@RequestParam UUID brandId, @RequestParam UUID newBrandId) {
        log.info("Replacing brand {} with new brand {}", brandId, newBrandId);
        int updated = productService.replaceBrand(brandId, newBrandId);
        return new ReassignBrandResponse(updated);
    }

    // ============================
    // REMOVE CATEGORY
    // ============================
    @PatchMapping("/category/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCategory(@PathVariable UUID categoryId) {
        log.info("Removing category {}", categoryId);
        productService.removeCategory(categoryId);
    }

    // ============================
    // REPLACE PRODUCT CATEGORY
    // ============================
    @Operation(summary = "Replace category from product")
    @PatchMapping("/category")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replaceCategory(@RequestBody @Valid CategoryReplaceRequest request) {
        log.info("Replacing category from product {}", request);
        productService.replaceCategory(request.from(), request.to());
    }

    // ============================
    // CLEAR PRODUCT CATEGORY
    // ============================
    @PatchMapping("/category/{categoryId}/clear")
    public int clearCategory(@PathVariable UUID categoryId) {
        log.info("Clearing category {} from products", categoryId);
        return productService.clearCategory(categoryId);
    }

    // ============================
    // EXIST PRODUCTS BY SUPPLIER
    // ============================
    @GetMapping("/supplier/{id}/exist")
    public Boolean existsProductsBySupplier(@PathVariable @NotNull UUID id) {
        log.info("Checking if products exists by supplier {}", id);
        return productService.existBySupplier(id);
    }
}