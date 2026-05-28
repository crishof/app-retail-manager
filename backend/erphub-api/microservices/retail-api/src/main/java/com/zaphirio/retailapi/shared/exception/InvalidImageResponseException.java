package com.zaphirio.retailapi.shared.exception;

public class InvalidImageResponseException extends RuntimeException {
    public InvalidImageResponseException(String message) {
        super(message);
    }
}
