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
 * Sales Invoice Response DTO.
 * Used for returning sales invoice data to API clients.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SalesInvoiceResponse {

    private UUID id;
    private UUID saleId;
    private UUID customerId;
    private UUID branchId;
    private UUID locationId;

    private String number;
    private String documentType;

    private LocalDate issueDate;
    private LocalDate dueDate;

    private double totalPrice;
    private String status;
    private String paymentStatus;

    private double amountPaid;
    private double remainingAmount;
    private String paymentMethod;

    private String observations;

    @Builder.Default
    private List<SalesInvoiceItemResponse> items = new ArrayList<>();

    private Long tenantId;
}
