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
 * Create Quote Request DTO.
 * Used for creating a new quote.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateQuoteRequest {

    private UUID customerId;
    private UUID branchId;
    private UUID locationId;

    private LocalDate creationDate;
    private LocalDate expirationDate;
    private Integer validityDays;

    private String observations;

    @Builder.Default
    private List<CreateQuoteItemRequest> items = new ArrayList<>();
}
