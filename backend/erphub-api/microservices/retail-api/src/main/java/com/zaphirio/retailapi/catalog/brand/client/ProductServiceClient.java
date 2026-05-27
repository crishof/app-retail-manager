package com.zaphirio.retailapi.catalog.brand.client;

import com.zaphirio.retailapi.catalog.brand.dto.ReassignBrandResponse;
import com.zaphirio.retailapi.catalog.brand.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceClient {

    private final ProductFeignClient productFeignClient;

    public boolean hasProductsForBrand(UUID brandId) {
        try {
            Boolean exists = productFeignClient.hasProductsForBrand(brandId);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error calling product-sv for brand {}", brandId, e);
            throw new BusinessException("Failed to verify if brand has products");
        }
    }

    public ReassignBrandResponse replaceBrand(UUID brandId, UUID newBrandId) {
        try {
            log.info("Calling product-sv to replace brand {} with {}", brandId, newBrandId);
            return productFeignClient.replaceBrand(brandId, newBrandId);
        } catch (Exception e) {
            log.error("Failed to replace brand in product-sv", e);
            throw new BusinessException("Failed to reassign products to target brand");
        }
    }
}