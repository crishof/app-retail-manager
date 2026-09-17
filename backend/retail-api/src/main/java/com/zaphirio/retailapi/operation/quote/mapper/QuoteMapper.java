package com.zaphirio.retailapi.operation.quote.mapper;

import com.zaphirio.retailapi.operation.quote.dto.*;
import com.zaphirio.retailapi.operation.quote.model.Quote;
import com.zaphirio.retailapi.operation.quote.model.QuoteItem;
import org.springframework.stereotype.Component;

/**
 * Mapper for Quote entity <-> DTO conversions.
 */
@Component
public class QuoteMapper {

    public QuoteResponse toResponse(Quote quote) {
        if (quote == null) {
            return null;
        }

        return QuoteResponse.builder()
                .id(quote.getId())
                .customerId(quote.getCustomerId())
                .branchId(quote.getBranchId())
                .locationId(quote.getLocationId())
                .number(quote.getNumber())
                .creationDate(quote.getCreationDate())
                .expirationDate(quote.getExpirationDate())
                .validityDays(quote.getValidityDays())
                .totalPrice(quote.getTotalPrice())
                .status(quote.getStatus() != null ? quote.getStatus().name() : null)
                .saleId(quote.getSaleId())
                .observations(quote.getObservations())
                .items(quote.getItems().stream()
                        .map(this::itemToResponse)
                        .toList())
                .tenantId(quote.getTenantId())
                .build();
    }

    public QuoteItemResponse itemToResponse(QuoteItem item) {
        if (item == null) {
            return null;
        }

        return QuoteItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercentage(item.getDiscountPercentage())
                .taxRate(item.getTaxRate())
                .lineTotal(item.getLineTotal())
                .lineTotalWithTax(item.getLineTotalWithTax())
                .orderIndex(item.getOrderIndex())
                .build();
    }

    public Quote toEntity(CreateQuoteRequest request) {
        if (request == null) {
            return null;
        }

        return Quote.builder()
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .locationId(request.getLocationId())
                .creationDate(request.getCreationDate())
                .expirationDate(request.getExpirationDate())
                .validityDays(request.getValidityDays())
                .observations(request.getObservations())
                .status(Quote.QuoteStatus.DRAFT)
                .build();
    }

    public QuoteItem itemToEntity(CreateQuoteItemRequest request) {
        if (request == null) {
            return null;
        }

        QuoteItem item = QuoteItem.builder()
                .productId(request.getProductId())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .unitPrice(request.getUnitPrice())
                .discountPercentage(request.getDiscountPercentage())
                .taxRate(request.getTaxRate())
                .orderIndex(request.getOrderIndex())
                .build();

        item.updateLineTotal();
        return item;
    }

    public void updateEntity(Quote quote, UpdateQuoteRequest request) {
        if (request == null) {
            return;
        }

        if (request.getExpirationDate() != null) {
            quote.setExpirationDate(request.getExpirationDate());
        }
        if (request.getValidityDays() != null) {
            quote.setValidityDays(request.getValidityDays());
        }
        if (request.getStatus() != null) {
            try {
                quote.setStatus(Quote.QuoteStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        if (request.getObservations() != null) {
            quote.setObservations(request.getObservations());
        }
    }

    public void updateItem(QuoteItem item, UpdateQuoteItemRequest request) {
        if (request == null) {
            return;
        }

        if (request.getProductId() != null) {
            item.setProductId(request.getProductId());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getQuantity() > 0) {
            item.setQuantity(request.getQuantity());
        }
        if (request.getUnitPrice() > 0) {
            item.setUnitPrice(request.getUnitPrice());
        }
        if (request.getDiscountPercentage() >= 0) {
            item.setDiscountPercentage(request.getDiscountPercentage());
        }
        if (request.getTaxRate() != null) {
            item.setTaxRate(request.getTaxRate());
        }
        if (request.getOrderIndex() != null) {
            item.setOrderIndex(request.getOrderIndex());
        }

        item.updateLineTotal();
    }
}
