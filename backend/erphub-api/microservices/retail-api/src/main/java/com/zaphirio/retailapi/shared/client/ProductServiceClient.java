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

    // TODO: Integrate with product-sv when available

    public boolean hasProductsForBrand(UUID brandId) {
        try {
            // TODO: Implement product checking logic
            return false;
        } catch (Exception e) {
            log.error("Error calling product service for brand {}", brandId, e);
            throw new BusinessException("Failed to verify if brand has products");
        }
    }

    public ReassignBrandResponse replaceBrand(UUID brandId, UUID newBrandId) {
        try {
            log.info("Calling product service to replace brand {} with {}", brandId, newBrandId);
            // TODO: Implement brand replacement logic
            return new ReassignBrandResponse(0);
        } catch (Exception e) {
            log.error("Failed to replace brand in product service", e);
            throw new BusinessException("Failed to reassign products to target brand");
        }
    }

    public boolean existsProductsBySupplier(UUID id) {
        try {
            // TODO: Implement product checking logic by supplier
            return false;
        } catch (Exception e) {
            log.error("Error when checking if product exists by supplier id {}", id, e);
            throw new BusinessException("Failed to check if product exists by supplier id " + id);
        }
    }

    public int clearCategory(UUID categoryId) {
        log.info("Clearing category {} from products", categoryId);

        try {
            // TODO: Implement category clearing logic
            return 0;
        } catch (Exception e) {
            log.error("Error while clearing category {} in product service", categoryId, e);
            throw new BusinessException("Failed to clear category " + categoryId);
        }
    }
}