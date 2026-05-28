package com.zaphirio.retailapi.catalog.category.client;

import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceClient {

    private final ProductFeignClient productFeignClient;

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