package com.zaphirio.retailapi.operation.sales.exception;

import java.util.UUID;

public class SaleNotFoundException extends RuntimeException {

    public SaleNotFoundException(UUID id) {
        super("Sale with id " + id + " not found");
    }
    public SaleNotFoundException(String message) {
        super(message);
    }
}
