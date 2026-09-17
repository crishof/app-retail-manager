package com.zaphirio.retailapi.party.branch.dto;

import com.zaphirio.retailapi.party.branch.model.StockLocation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationResponse {

    private UUID id;
    private String code;
    private String name;
    private String address;
    private StockLocation.LocationType locationType;
    private boolean active;
}
