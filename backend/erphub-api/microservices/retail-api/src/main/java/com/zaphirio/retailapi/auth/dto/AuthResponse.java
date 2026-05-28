package com.zaphirio.retailapi.auth.dto;

import com.zaphirio.retailapi.auth.model.User;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String fullName,
        String email,
        String role,
        String status,
        String accessToken,
        String refreshToken,
        String tokenType
) {
    public static AuthResponse from(User user, String accessToken, String refreshToken) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                accessToken,
                refreshToken,
                "Bearer"
        );
    }
}