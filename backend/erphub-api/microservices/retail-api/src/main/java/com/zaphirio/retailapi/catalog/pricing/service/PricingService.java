package com.zaphirio.retailapi.catalog.pricing.service;

import com.zaphirio.retailapi.catalog.pricing.dto.PriceRequest;
import com.zaphirio.retailapi.catalog.pricing.dto.PriceResponse;
import com.zaphirio.retailapi.catalog.pricing.dto.PurchasePriceUpdateRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PricingService {

    UUID createOrUpdatePrice(PriceRequest request);

    void updatePurchasePrice(PurchasePriceUpdateRequest request);

    List<PriceResponse> getProductPrices(UUID productId);

    UUID createSnapshot(
            UUID productId,
            BigDecimal purchasePrice,
            BigDecimal suggestedPrice,
            BigDecimal suggestedWebPrice,
            BigDecimal taxRate
    );
}