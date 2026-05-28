package com.zaphirio.retailapi.operation.cash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tbl_cash_movement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID sessionId;
    private UUID branchId;

    @Enumerated(EnumType.STRING)
    private MovementType type;

    private String currency;
    private double originalAmount;
    private double exchangeRateToArs;

    private double amount;
    private String description;
    private String reference;
    private LocalDateTime createdAt;
}
