package com.zaphirio.retailapi.party.supplier.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SupplierResponse {

    private UUID id;
    private String name;
    private String taxId;
    private String legalName;
    private UUID addressId;
}
