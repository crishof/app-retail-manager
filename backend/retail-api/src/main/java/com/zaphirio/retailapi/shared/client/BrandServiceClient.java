package com.zaphirio.retailapi.shared.client;


import com.zaphirio.retailapi.catalog.brand.service.BrandInternalService;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrandServiceClient {

    private final BrandInternalService brandInternalService;

    public UUID getIdOrCreate(String brandName) {
        try {
            return brandInternalService.getIdOrCreate(brandName);
        } catch (Exception e) {
            log.error("Error calling brand service for brand={}", brandName, e);
            throw new BusinessException("Failed to obtain brand id");
        }
    }
}