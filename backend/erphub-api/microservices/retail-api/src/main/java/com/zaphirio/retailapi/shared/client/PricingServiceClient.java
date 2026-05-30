package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.pricing.service.PricingService;
import com.zaphirio.retailapi.catalog.pricing.dto.PurchasePriceUpdateRequest;
import com.zaphirio.retailapi.catalog.product.dto.PricingPriceResponse;
import com.zaphirio.retailapi.catalog.product.dto.PriceRequest;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingServiceClient {

    private final PricingService pricingService;

    public UUID createSnapshot(UUID productId, double price, double suggestedPrice, double suggestedWebPrice, double taxRate) {
        try {
            return pricingService.createSnapshot(
                    productId,
                    BigDecimal.valueOf(price),
                    BigDecimal.valueOf(suggestedPrice),
                    BigDecimal.valueOf(suggestedWebPrice),
                    BigDecimal.valueOf(taxRate)
            );
        } catch (Exception e) {
            log.error("Error creating pricing snapshot for product {}", productId, e);
            throw new BusinessException("Failed to create pricing snapshot");
        }
    }

    public void update(UUID priceId, PriceRequest request) {
        try {
            pricingService.updatePurchasePrice(
                    PurchasePriceUpdateRequest.builder()
                            .productId(request.getProductId())
                            .purchasePrice(BigDecimal.valueOf(request.getPurchasePrice()))
                            .taxRate(request.getTaxRate() > 0 ? BigDecimal.valueOf(request.getTaxRate()) : null)
                            .discountRate(request.getDiscountRate() != null ? BigDecimal.valueOf(request.getDiscountRate()) : null)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error updating price {}", priceId, e);
            throw new BusinessException("Failed to update price");
        }
    }

    public List<PricingPriceResponse> getProductPrices(UUID productId) {
        try {
            var responses = pricingService.getProductPrices(productId);
            return responses.stream()
                    .map(r -> PricingPriceResponse.builder()
                            .id(r.getId())
                            .type(r.getType().name())
                            .name(r.getName())
                            .amount(r.getAmount())
                            .taxRate(r.getTaxRate())
                            .discountRate(r.getDiscountRate())
                            .active(r.isActive())
                            .build())
                    .toList();
        } catch (Exception e) {
            log.warn("Error fetching prices for product {}", productId, e);
            return List.of();
        }
    }
}