package com.zaphirio.retailapi.inventory.mapper;

import com.zaphirio.retailapi.inventory.dto.*;
import com.zaphirio.retailapi.inventory.model.InventorySession;
import com.zaphirio.retailapi.inventory.model.InventoryItem;
import org.springframework.stereotype.Component;

/**
 * Mapper for Inventory entity <-> DTO conversions.
 */
@Component
public class InventoryMapper {

    public InventorySessionResponse sessionToResponse(InventorySession session) {
        if (session == null) {
            return null;
        }

        return InventorySessionResponse.builder()
                .id(session.getId())
                .branchId(session.getBranchId())
                .depositId(session.getDepositId())
                .sessionDate(session.getSessionDate())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .status(session.getStatus() != null ? session.getStatus().name() : null)
                .initiatedByUserId(session.getInitiatedByUserId())
                .confirmedByUserId(session.getConfirmedByUserId())
                .observations(session.getObservations())
                .items(session.getItems().stream()
                        .map(this::itemToResponse)
                        .toList())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    public InventoryItemResponse itemToResponse(InventoryItem item) {
        if (item == null) {
            return null;
        }

        return InventoryItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .systemQuantity(item.getSystemQuantity())
                .zonaACount(item.getZonaACount())
                .zonaBCount(item.getZonaBCount())
                .zonaCCount(item.getZonaCCount())
                .totalCount(item.getTotalCount())
                .variance(item.getVariance())
                .variancePercentage(item.getVariancePercentage())
                .notes(item.getNotes())
                .orderIndex(item.getOrderIndex())
                .build();
    }

    public InventorySession toEntity(CreateInventorySessionRequest request) {
        if (request == null) {
            return null;
        }

        return InventorySession.builder()
                .branchId(request.getBranchId())
                .depositId(request.getDepositId())
                .sessionDate(request.getSessionDate())
                .observations(request.getObservations())
                .status(InventorySession.InventorySessionStatus.DRAFT)
                .build();
    }

    public InventoryItem itemToEntity(CreateInventoryItemRequest request) {
        if (request == null) {
            return null;
        }

        InventoryItem item = InventoryItem.builder()
                .productId(request.getProductId())
                .systemQuantity(request.getSystemQuantity())
                .zonaACount(request.getZonaACount())
                .zonaBCount(request.getZonaBCount())
                .zonaCCount(request.getZonaCCount())
                .notes(request.getNotes())
                .orderIndex(request.getOrderIndex())
                .build();

        item.updateCalculations();
        return item;
    }

    public void updateEntity(InventorySession session, UpdateInventorySessionRequest request) {
        if (request == null) {
            return;
        }

        if (request.getObservations() != null) {
            session.setObservations(request.getObservations());
        }
    }

    public void updateItem(InventoryItem item, UpdateInventoryItemRequest request) {
        if (request == null) {
            return;
        }

        if (request.getZonaACount() >= 0) {
            item.setZonaACount(request.getZonaACount());
        }
        if (request.getZonaBCount() >= 0) {
            item.setZonaBCount(request.getZonaBCount());
        }
        if (request.getZonaCCount() >= 0) {
            item.setZonaCCount(request.getZonaCCount());
        }
        if (request.getNotes() != null) {
            item.setNotes(request.getNotes());
        }
        if (request.getOrderIndex() != null) {
            item.setOrderIndex(request.getOrderIndex());
        }

        item.updateCalculations();
    }
}
