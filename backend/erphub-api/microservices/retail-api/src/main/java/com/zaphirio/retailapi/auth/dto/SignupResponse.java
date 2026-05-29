package com.zaphirio.retailapi.auth.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupResponse {
    private UUID userId;
    private String email;
    private String message;
    private boolean emailVerificationRequired;
}
