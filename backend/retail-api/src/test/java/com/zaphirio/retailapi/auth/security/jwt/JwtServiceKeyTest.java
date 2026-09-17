package com.zaphirio.retailapi.auth.security.jwt;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for the JWT signing-key resolution (security hardening R1).
 * Verifies that a missing/empty secret fails fast unless the insecure
 * development fallback is explicitly enabled.
 */
class JwtServiceKeyTest {

    private static final long EXP = 3_600_000L;
    private static final long REFRESH = 86_400_000L;
    // 256-bit Base64 key (32 bytes) — valid for HMAC-SHA.
    private static final String VALID_KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

    @Test
    void emptyKeyWithoutFallback_failsFast() {
        assertThrows(IllegalStateException.class,
                () -> new JwtService("", EXP, REFRESH, false));
    }

    @Test
    void blankKeyWithoutFallback_failsFast() {
        assertThrows(IllegalStateException.class,
                () -> new JwtService("   ", EXP, REFRESH, false));
    }

    @Test
    void emptyKeyWithFallbackEnabled_usesInsecureFallback() {
        assertDoesNotThrow(() -> new JwtService("", EXP, REFRESH, true));
    }

    @Test
    void providedKey_isAlwaysAccepted() {
        assertDoesNotThrow(() -> new JwtService(VALID_KEY, EXP, REFRESH, false));
    }
}
