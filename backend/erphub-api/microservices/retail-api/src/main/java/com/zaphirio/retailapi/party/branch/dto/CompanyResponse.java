package com.zaphirio.retailapi.party.branch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompanyResponse {

    private UUID id;
    private String name;
    private String cuit;
    private String ivaStatus;
    private LocalDate startOfActivities;
    private String grossIncomeNumber;
    private String legalName;
    private String email;
    private String phone;
    private String website;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
