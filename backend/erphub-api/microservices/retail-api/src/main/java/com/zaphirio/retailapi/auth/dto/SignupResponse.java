package com.zaphirio.retailapi.auth.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.util.UUID;

@JsonSerialize
@JsonDeserialize
public class SignupResponse {
    public UUID userId;
    public String email;
    public String message;
    public boolean emailVerificationRequired;

    public SignupResponse() {
    }

    public SignupResponse(UUID userId, String email, String message, boolean emailVerificationRequired) {
        this.userId = userId;
        this.email = email;
        this.message = message;
        this.emailVerificationRequired = emailVerificationRequired;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEmailVerificationRequired() {
        return emailVerificationRequired;
    }

    public void setEmailVerificationRequired(boolean emailVerificationRequired) {
        this.emailVerificationRequired = emailVerificationRequired;
    }
}
