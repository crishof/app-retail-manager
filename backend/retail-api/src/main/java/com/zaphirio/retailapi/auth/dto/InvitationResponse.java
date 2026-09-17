package com.zaphirio.retailapi.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
        UUID invitationId,
        String email,
        String role,
        String token,
        Instant expiresAt,
        boolean used
) {
}
