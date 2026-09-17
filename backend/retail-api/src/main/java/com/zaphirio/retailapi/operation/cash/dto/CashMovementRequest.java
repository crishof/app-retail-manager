package com.zaphirio.retailapi.operation.cash.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CashMovementRequest {
    private UUID sessionId;
    private UUID branchId;
    private String type;
    private double amount;
    private String currency;
    private double exchangeRateToArs;
    private String description;
    private String reference;
}
