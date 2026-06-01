package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Update Purchase Invoice Request DTO.
 * Used for updating existing purchase invoices.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdatePurchaseInvoiceRequest {

    private LocalDate dueDate;
    private BigDecimal retentionPercentage;
    private String observations;
}
