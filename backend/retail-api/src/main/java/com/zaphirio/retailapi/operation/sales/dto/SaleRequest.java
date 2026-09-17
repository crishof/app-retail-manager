package com.zaphirio.retailapi.operation.sales.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleRequest {

    private UUID customerId;
    private UUID branchId;
    private UUID locationId;

    private LocalDate invoiceDate;

    private String invoiceType;
    private String invoicePrefix;
    private String invoiceNumber;

    private String observations;

    private List<SaleItemRequest> invoiceItemsRequest;

    private double subtotal1;
    private double discount;
    private double interest;
    private double subtotal2;

    private double netValue0;
    private double netValue105;
    private double netValue21;
    private double netValue27;

    private double vat105;
    private double vat21;
    private double vat27;
    private double internalTax;

    private double withholdingVat;
    private double withholdingSuss;
    private double withholdingGrossReceiptsTax;
    private double withholdingIncome;
    private double stateTax;
    private double localTax;
    private double rounding;

    private double totalPrice;
}
