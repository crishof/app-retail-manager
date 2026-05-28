package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a single line in the supplier account statement.
 * DEBIT = amount owed (invoice). CREDIT = amount paid (payment/adjustment).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AccountMovementResponse {

    private UUID id;
    /** INVOICE, PAYMENT, ADJUSTMENT */
    private String type;
    private LocalDate date;
    private String reference;
    private String description;
    /** Positive = debit (increases debt); negative = credit (reduces debt) */
    private double amount;
    /** Running balance after this movement */
    private double balance;
}
