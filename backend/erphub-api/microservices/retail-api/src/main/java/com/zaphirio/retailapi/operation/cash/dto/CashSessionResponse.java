package com.zaphirio.retailapi.operation.cash.dto;

import com.zaphirio.retailapi.operation.cash.model.SessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class CashSessionResponse {
    private UUID id;
    private UUID branchId;
    private UUID userId;
    private LocalDate sessionDate;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private double openingBalance;
    private double closingBalance;
    private SessionStatus status;
    private String notes;
    private double totalIncome;
    private double totalExpense;
    private double expectedBalance;
    private Map<String, Double> countedTotalsByCurrency;
    private Map<String, Double> exchangeRatesToArs;
}
