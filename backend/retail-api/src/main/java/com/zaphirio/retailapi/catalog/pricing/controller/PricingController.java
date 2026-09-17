package com.zaphirio.retailapi.catalog.pricing.controller;

import com.zaphirio.retailapi.catalog.pricing.dto.CreateSnapshotPriceRequest;
import com.zaphirio.retailapi.catalog.pricing.dto.PriceRequest;
import com.zaphirio.retailapi.catalog.pricing.dto.PriceResponse;
import com.zaphirio.retailapi.catalog.pricing.dto.PurchasePriceUpdateRequest;
import com.zaphirio.retailapi.catalog.pricing.service.PricingService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/pricing")
@RequiredArgsConstructor
@Validated
@Hidden
public class PricingController {

    private final PricingService pricingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UUID createOrUpdatePrice(@RequestBody @Valid PriceRequest request) {
        return pricingService.createOrUpdatePrice(request);
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void updatePurchasePrice(@RequestBody @Valid PurchasePriceUpdateRequest request) {
        pricingService.updatePurchasePrice(request);
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<PriceResponse> getProductPrices(@PathVariable UUID productId) {
        return pricingService.getProductPrices(productId);
    }

    // Usado por product-sv al importar
    @PostMapping("/snapshot")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UUID createSnapshot(@RequestBody @Valid CreateSnapshotPriceRequest request) {

        return pricingService.createSnapshot(
                request.getProductId(),
                request.getPurchasePrice(),
                request.getSuggestedPrice(),
                request.getSuggestedWebPrice(),
                request.getTaxRate()
        );
    }
}