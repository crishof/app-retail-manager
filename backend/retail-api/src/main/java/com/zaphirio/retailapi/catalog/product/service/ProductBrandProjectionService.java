package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.catalog.product.messagging.event.BrandUpdatedEvent;
import com.zaphirio.retailapi.catalog.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductBrandProjectionService {

    private final ProductRepository productRepository;

    @Transactional
    public void handleBrandUpdated(BrandUpdatedEvent event) {
        log.info("Received BrandUpdatedEvent: {}", event);
        if (event.deleted()) {
            productRepository.clearBrandFromProducts(event.brandId());
        } else {
            productRepository.updateBrandName(event.brandId(), event.name());
        }
    }
}