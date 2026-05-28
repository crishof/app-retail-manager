package com.zaphirio.retailapi.operation.sales.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tbl_sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID customerId;

    private UUID branchId;
    private UUID locationId;

    private LocalDate saleDate;

    private String saleType;
    private String saleNumber;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

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
    private String observations;
}
