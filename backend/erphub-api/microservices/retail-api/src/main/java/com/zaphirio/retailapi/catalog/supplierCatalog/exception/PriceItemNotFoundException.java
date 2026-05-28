package com.zaphirio.retailapi.catalog.supplierCatalog.exception;

import java.util.UUID;

public class PriceItemNotFoundException extends RuntimeException {
    public PriceItemNotFoundException(UUID id) {
        super("Product with id " + id + " not found");
    }
}
