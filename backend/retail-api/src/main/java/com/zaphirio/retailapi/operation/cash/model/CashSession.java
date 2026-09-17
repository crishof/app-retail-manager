package com.zaphirio.retailapi.operation.cash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tbl_cash_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID branchId;
    private UUID userId;

    private LocalDate sessionDate;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    private double openingBalance;
    private double closingBalance;

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @Column(columnDefinition = "TEXT")
    private String countedTotalsByCurrencyJson;

    @Column(columnDefinition = "TEXT")
    private String exchangeRatesToArsJson;

    private String notes;
}
