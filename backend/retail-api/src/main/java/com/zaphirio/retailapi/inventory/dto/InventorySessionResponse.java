package com.zaphirio.retailapi.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * InventorySession Response DTO.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InventorySessionResponse {

    private UUID id;
    private UUID branchId;
    private UUID depositId;

    private LocalDate sessionDate;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private String status;
    private UUID initiatedByUserId;
    private UUID confirmedByUserId;

    private String observations;

    @Builder.Default
    private List<InventoryItemResponse> items = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
