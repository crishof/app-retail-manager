package com.zaphirio.retailapi.operation.quote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Quote Response DTO.
 * Used for returning quote data to API clients.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class QuoteResponse {

    private UUID id;
    private UUID customerId;
    private UUID branchId;
    private UUID locationId;

    private String number;
    private LocalDate creationDate;
    private LocalDate expirationDate;
    private Integer validityDays;

    private double totalPrice;
    private String status;

    private UUID saleId;
    private String observations;

    @Builder.Default
    private List<QuoteItemResponse> items = new ArrayList<>();

    private Long tenantId;
}
