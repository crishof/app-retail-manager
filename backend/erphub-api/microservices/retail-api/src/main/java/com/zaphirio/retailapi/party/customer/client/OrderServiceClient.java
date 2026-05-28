package com.zaphirio.retailapi.party.customer.client;

import com.zaphirio.retailapi.party.customer.dto.ReassignCustomerResponse;
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

    public boolean hasOrdersForCustomer(UUID customerId) {
        try {
            return Boolean.TRUE.equals(orderClient.hasOrdersForCustomer(customerId));
        } catch (Exception e) {
            log.error("Error while calling order-sv for customer id={}", customerId, e);
            throw new BusinessException("Failed to verify if customer has orders");
        }
    }

    public ReassignCustomerResponse replaceCustomer(UUID sourceCustomerId, UUID targetCustomerId) {
        try {
            log.info("Calling order-sv to replace customer {} with {}", sourceCustomerId, targetCustomerId);
            return orderClient.replaceCustomer(sourceCustomerId, targetCustomerId);
        } catch (Exception e) {
            log.error("Failed to replace customer in order-sv", e);
            throw new BusinessException("Failed to reassign orders to target customer");
        }
    }
}