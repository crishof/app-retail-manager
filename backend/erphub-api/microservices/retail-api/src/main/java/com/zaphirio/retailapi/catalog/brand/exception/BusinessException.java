package com.zaphirio.retailapi.catalog.brand.exception;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}