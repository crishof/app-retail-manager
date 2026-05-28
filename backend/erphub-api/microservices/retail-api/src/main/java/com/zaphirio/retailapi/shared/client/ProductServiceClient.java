package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.brand.dto.ReassignBrandResponse;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceClient {

    private final ProductAPIClient productFeignClient;

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

    public boolean existsProductsBySupplier(UUID id) {
        try {
            Boolean exists = productFeignClient.existsProductsBySupplier(id);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error when checking if product exists by supplier id {}", id, e);
            throw new BusinessException("Failed to check if product exists by supplier id " + id);
        }
    }

    public int clearCategory(UUID categoryId) {
        log.info("Clearing category {} from products", categoryId);

        try {
            Integer affected = productFeignClient.clearCategory(categoryId);

            if (affected == null) {
                throw new BusinessException("Product service returned null when clearing category " + categoryId);
            }

            log.info("Cleared category {} from {} products", categoryId, affected);
            return affected;

        } catch (Exception e) {
            log.error("Error while clearing category {} in product-sv", categoryId, e);
            throw new BusinessException("Failed to clear category " + categoryId);
        }
    }

}