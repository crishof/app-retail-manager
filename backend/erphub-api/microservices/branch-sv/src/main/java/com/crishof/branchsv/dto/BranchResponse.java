package com.crishof.branchsv.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BranchResponse {

    private UUID id;
    private UUID companyId;
    private String code;
    private String name;
    private String address;
    private String locality;
    private String postalCode;
    private String country;
    private String phone;
    private String email;
    private String website;
    private Integer pointOfSale;
    private boolean active;
    private List<LocationResponse> locations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

