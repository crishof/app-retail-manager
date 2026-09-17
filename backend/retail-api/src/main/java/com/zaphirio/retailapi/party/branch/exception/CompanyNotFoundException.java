package com.zaphirio.retailapi.party.branch.exception;

import java.util.UUID;

public class CompanyNotFoundException extends Exception {

    public CompanyNotFoundException() {
        super();
    }

    public CompanyNotFoundException(String message) {
        super(message);
    }

    public CompanyNotFoundException(UUID id) {
        super(String.format("Company with id %s not found", id));
    }
}
