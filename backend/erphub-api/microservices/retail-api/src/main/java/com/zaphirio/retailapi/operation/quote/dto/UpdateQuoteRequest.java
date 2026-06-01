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
 * Update Quote Request DTO.
 * Used for updating an existing quote.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateQuoteRequest {

    private LocalDate expirationDate;
    private Integer validityDays;

    private String status;
    private String observations;

    @Builder.Default
    private List<UpdateQuoteItemRequest> items = new ArrayList<>();
}
