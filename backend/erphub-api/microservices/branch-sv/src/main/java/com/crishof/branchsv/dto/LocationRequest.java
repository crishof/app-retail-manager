package com.crishof.branchsv.dto;

import com.crishof.branchsv.model.StockLocation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationRequest {

    @NotBlank
    @Size(max = 20)
    private String code;

    @NotBlank
    private String name;

    private String address;

    @Builder.Default
    private StockLocation.LocationType locationType = StockLocation.LocationType.SALES;

    @Builder.Default
    private boolean active = true;
}
