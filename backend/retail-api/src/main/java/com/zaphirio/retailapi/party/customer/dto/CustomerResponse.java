package com.zaphirio.retailapi.party.customer.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CustomerResponse {

    private UUID id;
    private String name;
    private String lastname;
    private String dni;
    private String taxId;
    private String email;
    private String phone;
    private UUID addressId;
}
