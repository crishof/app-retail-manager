package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SupplierPaymentResponse {

    private UUID id;
    private UUID supplierId;
    private UUID branchId;
    private LocalDate paymentDate;
    private double amount;
    private String paymentMethod;
    private String reference;
    private String description;
}
