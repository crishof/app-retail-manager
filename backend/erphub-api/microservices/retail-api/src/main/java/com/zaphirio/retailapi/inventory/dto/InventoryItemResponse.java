package com.zaphirio.retailapi.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * InventoryItem Response DTO.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InventoryItemResponse {

    private UUID id;
    private UUID productId;

    private int systemQuantity;
    private int zonaACount;
    private int zonaBCount;
    private int zonaCCount;

    private int totalCount;
    private int variance;
    private double variancePercentage;

    private String notes;
    private Integer orderIndex;
}
