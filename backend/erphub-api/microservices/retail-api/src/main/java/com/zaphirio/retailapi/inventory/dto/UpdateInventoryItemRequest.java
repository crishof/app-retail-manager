package com.zaphirio.retailapi.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Update InventoryItem Request DTO.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateInventoryItemRequest {

    private UUID id;
    private int zonaACount;
    private int zonaBCount;
    private int zonaCCount;
    private String notes;
    private Integer orderIndex;
}
