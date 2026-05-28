package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceClient {

    private final OrderClient orderClient;

    public boolean hasOrdersForProduct(UUID productId) {
        try {
            return orderClient.hasOrdersForProduct(productId);
        } catch (Exception e) {
            log.error("Error calling order-sv for product {}", productId, e);
            throw new BusinessException("Failed to verify orders for product");
        }
    }
}