package com.zaphirio.retailapi.operation.cash.dto;

import com.zaphirio.retailapi.operation.cash.model.MovementType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CashMovementResponse {
    private UUID id;
    private UUID sessionId;
    private MovementType type;
    private double amount;
    private String currency;
    private double originalAmount;
    private double exchangeRateToArs;
    private String description;
    private String reference;
    private LocalDateTime createdAt;
}
