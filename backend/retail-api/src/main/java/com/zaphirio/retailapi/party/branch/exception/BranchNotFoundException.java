package com.zaphirio.retailapi.party.branch.exception;

import java.util.UUID;

public class BranchNotFoundException extends Exception {

    public BranchNotFoundException() {
        super();
    }

    public BranchNotFoundException(String message) {
        super(message);
    }

    public BranchNotFoundException(UUID id) {
        super(String.format("Branch with id %s not found", id));
    }
}
