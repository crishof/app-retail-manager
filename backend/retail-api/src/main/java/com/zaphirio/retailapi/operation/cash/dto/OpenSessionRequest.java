package com.zaphirio.retailapi.operation.cash.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class OpenSessionRequest {
    private UUID branchId;
    private UUID userId;
    private double openingBalance;
    private String notes;
}
