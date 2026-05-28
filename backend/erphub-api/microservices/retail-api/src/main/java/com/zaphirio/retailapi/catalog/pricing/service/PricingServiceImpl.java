package com.zaphirio.retailapi.catalog.pricing.service;

import com.zaphirio.retailapi.catalog.pricing.dto.PriceRequest;
import com.zaphirio.retailapi.catalog.pricing.dto.PriceResponse;
import com.zaphirio.retailapi.catalog.pricing.dto.PurchasePriceUpdateRequest;
import com.zaphirio.retailapi.catalog.pricing.model.Price;
import com.zaphirio.retailapi.catalog.pricing.model.PriceType;
import com.zaphirio.retailapi.catalog.pricing.repository.PriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PricingServiceImpl implements PricingService {

    private final PriceRepository priceRepository;

    @Override
    public UUID createOrUpdatePrice(PriceRequest req) {

        Price price = priceRepository.findByProductIdAndType(req.getProductId(), req.getType()).orElse(Price.builder().productId(req.getProductId()).type(req.getType()).build());

        price.setName(req.getName());
        price.setAmount(req.getAmount());
        price.setTaxRate(req.getTaxRate());
        price.setDiscountRate(req.getDiscountRate());
        price.setActive(true);

        return priceRepository.save(price).getId();
    }

    /**
     * Usado EXCLUSIVAMENTE desde supplier-invoice
     */
    @Override
    public void updatePurchasePrice(PurchasePriceUpdateRequest req) {

        Price price = priceRepository.findByProductIdAndType(req.getProductId(), PriceType.PURCHASE).orElse(Price.builder().productId(req.getProductId()).type(PriceType.PURCHASE).name("Purchase").build());

        price.setAmount(req.getPurchasePrice());
        price.setTaxRate(req.getTaxRate());
        price.setDiscountRate(req.getDiscountRate());
        price.setActive(true);

        priceRepository.save(price);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceResponse> getProductPrices(UUID productId) {

        return priceRepository.findByProductId(productId).stream().map(p -> PriceResponse.builder().id(p.getId()).type(p.getType()).name(p.getName()).amount(p.getAmount()).taxRate(p.getTaxRate()).discountRate(p.getDiscountRate()).active(p.isActive()).build()).toList();
    }

    @Override
    public UUID createSnapshot(
            UUID productId,
            BigDecimal purchasePrice,
            BigDecimal suggestedPrice,
            BigDecimal suggestedWebPrice,
            BigDecimal taxRate
    ) {

        // PURCHASE
        Price purchase = Price.builder()
                .productId(productId)
                .type(PriceType.PURCHASE)
                .name("Purchase")
                .amount(purchasePrice)
                .taxRate(taxRate)
                .active(true)
                .build();

        priceRepository.save(purchase);

        // LIST
        if (suggestedPrice != null) {
            priceRepository.save(
                    Price.builder()
                            .productId(productId)
                            .type(PriceType.LIST)
                            .name("List")
                            .amount(suggestedPrice)
                            .taxRate(taxRate)
                            .active(true)
                            .build()
            );
        }

        // WEB
        if (suggestedWebPrice != null) {
            priceRepository.save(
                    Price.builder()
                            .productId(productId)
                            .type(PriceType.WEB)
                            .name("Web")
                            .amount(suggestedWebPrice)
                            .taxRate(taxRate)
                            .active(true)
                            .build()
            );
        }

        // Retornamos el purchase price como referencia principal
        return purchase.getId();
    }
}