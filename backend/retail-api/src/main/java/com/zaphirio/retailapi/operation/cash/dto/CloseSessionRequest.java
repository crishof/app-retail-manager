package com.zaphirio.retailapi.operation.cash.dto;

import lombok.Data;

import java.util.Map;

@Data
public class CloseSessionRequest {
    private double closingBalance;
    private String notes;
    private Map<String, Double> countedTotalsByCurrency;
    private Map<String, Double> exchangeRatesToArs;
}
