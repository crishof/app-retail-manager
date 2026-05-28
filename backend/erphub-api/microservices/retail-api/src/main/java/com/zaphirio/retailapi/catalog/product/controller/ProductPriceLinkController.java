package com.zaphirio.retailapi.catalog.product.controller;

import com.zaphirio.retailapi.catalog.product.dto.ProductPriceLinkRequest;
import com.zaphirio.retailapi.catalog.product.dto.ProductPriceLinkResponse;
import com.zaphirio.retailapi.catalog.product.dto.ProductPriceHistoryResponse;
import com.zaphirio.retailapi.catalog.product.service.ProductPriceLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/product-price-links")
@RequiredArgsConstructor
public class ProductPriceLinkController {

    private final ProductPriceLinkService linkService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductPriceLinkResponse createLink(@RequestBody ProductPriceLinkRequest request) {
        return linkService.linkSupplierProduct(
                request.getSupplierProductId(),
                UUID.fromString(request.getProductId()),
                request.getSupplierCode(),
                request.getLastImportedPrice()
        );
    }

    @PatchMapping("/price-update")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void notifyPriceUpdate(@RequestBody PriceUpdateRequest request) {
        linkService.notifyPriceUpdate(request.supplierProductId(), request.newPrice());
    }

    record PriceUpdateRequest(String supplierProductId, BigDecimal newPrice) {}

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<ProductPriceLinkResponse> getAlerts() {
        return linkService.getPriceAlerts();
    }

    @GetMapping("/alerts/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<ProductPriceLinkResponse> getProductAlerts(@PathVariable UUID productId) {
        return linkService.getPriceAlertsForProduct(productId);
    }

    @GetMapping("/{linkId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ProductPriceLinkResponse getLink(@PathVariable UUID linkId) {
        return linkService.getLink(linkId);
    }

    @GetMapping("/{linkId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<ProductPriceHistoryResponse> getPriceHistory(@PathVariable UUID linkId) {
        return linkService.getPriceHistory(linkId);
    }
}
