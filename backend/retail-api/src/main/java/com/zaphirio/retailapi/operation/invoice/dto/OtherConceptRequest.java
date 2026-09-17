package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OtherConceptRequest {

    private String description;
    private double price;
    private double taxRate;
    private double internalTaxRate;
    private double discountRate;
}
