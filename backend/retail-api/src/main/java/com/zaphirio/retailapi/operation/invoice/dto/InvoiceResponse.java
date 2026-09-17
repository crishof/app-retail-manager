package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvoiceResponse {

    List<InvoiceItemResponse> invoiceItems = new ArrayList<>();
    private UUID supplierId;
    private UUID branchId;
    private UUID locationId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate receptionDate;
    private LocalDate savedDate;
    private String invoiceType;
    private String invoiceNumber;
    private String packingListNumber;
    private boolean fixedAsset;

    private String observations;

    private double subtotal1;
    private Double discount;
    private double interest;
    private double subtotal2;

    private double netValue21;
    private double vat21;
    private double netValue105;
    private double vat105;
    private double netValue27;
    private double vat27;
    private double netValue0;

    private double internalTax;

    private double withholdingVat;
    private double withholdingSuss;
    private double withholdingGrossReceiptsTax;
    private double withholdingIncome;
    private double stateTax;
    private double localTax;

    private double rounding;

    private double totalPrice;

    private String currency;
}
