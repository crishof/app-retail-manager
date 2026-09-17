package com.zaphirio.retailapi.operation.invoice.mapper;

import com.zaphirio.retailapi.operation.invoice.dto.SalesInvoiceResponse;
import com.zaphirio.retailapi.operation.invoice.dto.SalesInvoiceItemResponse;
import com.zaphirio.retailapi.operation.invoice.dto.CreateSalesInvoiceRequest;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoice;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoiceItem;
import org.springframework.stereotype.Component;

/**
 * Mapper for SalesInvoice entity <-> DTO conversions.
 */
@Component
public class SalesInvoiceMapper {

    public SalesInvoiceResponse toResponse(SalesInvoice invoice) {
        if (invoice == null) {
            return null;
        }

        return SalesInvoiceResponse.builder()
                .id(invoice.getId())
                .saleId(invoice.getSaleId())
                .customerId(invoice.getCustomerId())
                .branchId(invoice.getBranchId())
                .locationId(invoice.getLocationId())
                .number(invoice.getNumber())
                .documentType(invoice.getDocumentType())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .totalPrice(invoice.getTotalPrice())
                .status(invoice.getStatus() != null ? invoice.getStatus().name() : null)
                .paymentStatus(invoice.getPaymentStatus() != null ? invoice.getPaymentStatus().name() : null)
                .amountPaid(invoice.getAmountPaid())
                .remainingAmount(invoice.getRemainingAmount())
                .paymentMethod(invoice.getPaymentMethod())
                .observations(invoice.getObservations())
                .items(invoice.getItems().stream()
                        .map(this::itemToResponse)
                        .toList())
                .tenantId(invoice.getTenantId())
                .build();
    }

    public SalesInvoiceItemResponse itemToResponse(SalesInvoiceItem item) {
        if (item == null) {
            return null;
        }

        return SalesInvoiceItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercentage(item.getDiscountPercentage())
                .taxRate(item.getTaxRate())
                .lineTotal(item.getLineTotal())
                .taxAmount(item.calculateTaxAmount())
                .lineTotalWithTax(item.getLineTotalWithTax())
                .orderIndex(item.getOrderIndex())
                .build();
    }

    public SalesInvoice toEntity(CreateSalesInvoiceRequest request) {
        if (request == null) {
            return null;
        }

        return SalesInvoice.builder()
                .saleId(request.getSaleId())
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .locationId(request.getLocationId())
                .number(request.getNumber())
                .documentType(request.getDocumentType())
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .totalPrice(request.getTotalPrice())
                .paymentMethod(request.getPaymentMethod())
                .observations(request.getObservations())
                .build();
    }

    public SalesInvoiceItem itemToEntity(com.zaphirio.retailapi.operation.invoice.dto.CreateSalesInvoiceItemRequest request) {
        if (request == null) {
            return null;
        }

        SalesInvoiceItem item = SalesInvoiceItem.builder()
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
}
