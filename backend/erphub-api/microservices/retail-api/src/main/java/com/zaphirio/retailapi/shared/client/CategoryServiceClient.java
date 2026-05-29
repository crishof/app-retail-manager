package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.category.service.CategoryInternalService;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceClient {

    private final CategoryInternalService categoryInternalService;

    public UUID getIdOrCreate(String categoryName) {
        try {
            return categoryInternalService.getIdOrCreate(categoryName);
        } catch (Exception e) {
            log.error("Error calling category service for category={}", categoryName, e);
            throw new BusinessException("Failed to obtain category id");
        }
    }
}