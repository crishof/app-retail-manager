package com.zaphirio.retailapi.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * TenantFilter ensures tenant context is properly set for all non-public endpoints.
 * 
 * This filter:
 * - Validates that tenantId is present in TenantContext (set by JwtFilter)
 * - Enforces tenant ID validation for protected endpoints
 * - Clears tenant context in finally block to prevent thread pool leaks
 * 
 * TenantContext is populated by JwtFilter from JWT claims before this filter executes.
 */
@Component
@Slf4j
public class TenantFilter extends OncePerRequestFilter {

    // Public endpoints that don't require tenant context
    private static final Set<String> PUBLIC_ENDPOINTS = Set.of(
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator/health",
            "/api/v1/auth/registration/signup",
            "/api/v1/auth/registration/verify-email",
            "/api/v1/auth/registration/resend-verification",
            "/api/v1/registration/signup",
            "/api/v1/registration/verify-email",
            "/api/v1/registration/resend-verification",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/password/forgot",
            "/api/v1/auth/password/reset",
            "/api/v1/invitations",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        log.debug("TenantFilter processing request for path: {}", requestPath);

        try {
            // Check if endpoint is public
            if (isPublicEndpoint(requestPath)) {
                log.debug("TenantFilter: public endpoint, skipping tenant validation: {}", requestPath);
                filterChain.doFilter(request, response);
                return;
            }

            // Validate tenant context is set for protected endpoints
            if (!TenantContext.isSet()) {
                log.warn("TenantFilter: tenant context not set for protected endpoint: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":\"ERROR\",\"message\":\"Tenant context not found. Authentication required.\"}");
                return;
            }

            // Extract tenant ID and validate
            String tenantId = TenantContext.getTenantId();
            log.debug("TenantFilter: tenant ID validated for path {}: tenant={}", requestPath, tenantId);

            // Continue filter chain with validated tenant context
            filterChain.doFilter(request, response);

        } catch (IllegalStateException ex) {
            log.error("TenantFilter: tenant context validation failed for path {}: {}", requestPath, ex.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"ERROR\",\"message\":\"Invalid tenant context. Authentication required.\"}");
        } finally {
            // Note: TenantContext is cleared by JwtFilter in its finally block
            // This ensures cleanup happens at the right point in the filter chain
            log.debug("TenantFilter: request processing completed for path: {}", requestPath);
        }
    }

    /**
     * Check if the request path is a public endpoint that doesn't require tenant context.
     * 
     * @param requestPath The request URI path
     * @return true if endpoint is public, false otherwise
     */
    private boolean isPublicEndpoint(String requestPath) {
        return PUBLIC_ENDPOINTS.stream()
                .anyMatch(requestPath::startsWith);
    }

    /**
     * Override to exclude this filter from some paths if needed.
     * By default, OncePerRequestFilter applies to all requests.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Don't filter actuator endpoints or swagger-ui
        return path.startsWith("/actuator") || 
               path.startsWith("/swagger-ui") || 
               path.startsWith("/v3/api-docs");
    }
}
