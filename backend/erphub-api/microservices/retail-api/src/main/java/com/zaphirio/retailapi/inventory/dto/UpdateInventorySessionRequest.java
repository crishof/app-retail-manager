package com.zaphirio.retailapi.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Update InventorySession Request DTO.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateInventorySessionRequest {

    private String observations;

    @Builder.Default
    private List<UpdateInventoryItemRequest> items = new ArrayList<>();
}
