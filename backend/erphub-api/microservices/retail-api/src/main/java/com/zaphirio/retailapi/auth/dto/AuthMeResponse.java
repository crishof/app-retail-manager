package com.zaphirio.retailapi.auth.dto;

import java.util.UUID;

public record AuthMeResponse(
        UUID id,
        String fullName,
        String email,
        String role,
        String status,
        Long tenantId
) {
}
