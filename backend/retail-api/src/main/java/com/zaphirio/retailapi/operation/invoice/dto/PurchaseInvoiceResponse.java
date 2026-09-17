package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Purchase Invoice Response DTO.
 * Used for returning purchase invoice data to API clients.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PurchaseInvoiceResponse {

    private UUID id;
    private UUID supplierId;
    private UUID branchId;
    private UUID locationId;

    private String number;
    private String documentType;
    private String supplierInvoiceNumber;

    private LocalDate issueDate;
    private LocalDate dueDate;

    private double totalPrice;
    private String status;

    private double retentionPercentage;
    private double retentionAmount;
    private double amountDueToSupplier;

    private String observations;

    @Builder.Default
    private List<PurchaseInvoiceItemResponse> items = new ArrayList<>();

    private Long tenantId;
}
