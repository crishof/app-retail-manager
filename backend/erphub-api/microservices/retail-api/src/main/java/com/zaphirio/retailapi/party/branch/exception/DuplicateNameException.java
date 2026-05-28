package com.zaphirio.retailapi.party.branch.exception;

public class DuplicateNameException extends RuntimeException {

    public DuplicateNameException() {
        super();
    }

    public DuplicateNameException(String message) {
        super(message);
    }
}
