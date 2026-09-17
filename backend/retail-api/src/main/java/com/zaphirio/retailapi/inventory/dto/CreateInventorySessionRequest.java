package com.zaphirio.retailapi.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Create InventorySession Request DTO.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateInventorySessionRequest {

    private UUID branchId;
    private UUID depositId;
    private LocalDate sessionDate;
    private String observations;

    @Builder.Default
    private List<CreateInventoryItemRequest> items = new ArrayList<>();
}
