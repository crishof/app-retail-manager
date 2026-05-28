package com.zaphirio.retailapi.party.supplier.client;

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

    public boolean existsProductsBySupplier(UUID id) {
        try {
            Boolean exists = productFeignClient.existsProductsBySupplier(id);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error when checking if product exists by supplier id {}", id, e);
            throw new BusinessException("Failed to check if product exists by supplier id " + id);
        }
    }
}