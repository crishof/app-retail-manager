package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Update Sales Invoice Request DTO.
 * Used for updating existing sales invoices.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSalesInvoiceRequest {

    private LocalDate dueDate;
    private String paymentMethod;
    private String observations;
}
