package com.zaphirio.retailapi.operation.invoice.mapper;

import com.zaphirio.retailapi.operation.invoice.dto.PurchaseInvoiceResponse;
import com.zaphirio.retailapi.operation.invoice.dto.PurchaseInvoiceItemResponse;
import com.zaphirio.retailapi.operation.invoice.dto.CreatePurchaseInvoiceRequest;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoice;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoiceItem;
import org.springframework.stereotype.Component;

/**
 * Mapper for PurchaseInvoice entity <-> DTO conversions.
 */
@Component
public class PurchaseInvoiceMapper {

    public PurchaseInvoiceResponse toResponse(PurchaseInvoice invoice) {
        if (invoice == null) {
            return null;
        }

        return PurchaseInvoiceResponse.builder()
                .id(invoice.getId())
                .supplierId(invoice.getSupplierId())
                .branchId(invoice.getBranchId())
                .locationId(invoice.getLocationId())
                .number(invoice.getNumber())
                .documentType(invoice.getDocumentType())
                .supplierInvoiceNumber(invoice.getSupplierInvoiceNumber())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .totalPrice(invoice.getTotalPrice())
                .status(invoice.getStatus() != null ? invoice.getStatus().name() : null)
                .retentionPercentage(invoice.getRetentionPercentage() != null ? invoice.getRetentionPercentage().doubleValue() : 0)
                .retentionAmount(invoice.getRetentionAmount() != null ? invoice.getRetentionAmount().doubleValue() : 0)
                .amountDueToSupplier(invoice.getAmountDueToSupplier())
                .observations(invoice.getObservations())
                .items(invoice.getItems().stream()
                        .map(this::itemToResponse)
                        .toList())
                .tenantId(invoice.getTenantId())
                .build();
    }

    public PurchaseInvoiceItemResponse itemToResponse(PurchaseInvoiceItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseInvoiceItemResponse.builder()
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
                .unitCostWithTax(item.getUnitCostWithTax())
                .orderIndex(item.getOrderIndex())
                .build();
    }

    public PurchaseInvoice toEntity(CreatePurchaseInvoiceRequest request) {
        if (request == null) {
            return null;
        }

        return PurchaseInvoice.builder()
                .supplierId(request.getSupplierId())
                .branchId(request.getBranchId())
                .locationId(request.getLocationId())
                .number(request.getNumber())
                .documentType(request.getDocumentType())
                .supplierInvoiceNumber(request.getSupplierInvoiceNumber())
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .totalPrice(request.getTotalPrice())
                .retentionPercentage(request.getRetentionPercentage())
                .observations(request.getObservations())
                .build();
    }

    public PurchaseInvoiceItem itemToEntity(com.zaphirio.retailapi.operation.invoice.dto.CreatePurchaseInvoiceItemRequest request) {
        if (request == null) {
            return null;
        }

        PurchaseInvoiceItem item = PurchaseInvoiceItem.builder()
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
