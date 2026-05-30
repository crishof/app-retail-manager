package com.zaphirio.retailapi.auth.security.jwt;

import com.zaphirio.retailapi.auth.security.principal.SecurityUserDetailsService;
import com.zaphirio.retailapi.shared.security.TenantContext;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final SecurityUserDetailsService userDetailsService;
    private final JwtService jwtService;

    private static final List<String> PUBLIC_PATHS = List.of(
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
        // Skip JWT filter for public endpoints
        String requestPath = request.getRequestURI();
        if (isPublicPath(requestPath)) {
            log.debug("JWT filter skipping public path: {}", requestPath);
            filterChain.doFilter(request, response);
            return;
        }
        log.debug("JWT filter processing request for path {}", request.getRequestURI());
        final String authHeader = request.getHeader("Authorization");

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                log.debug("JWT filter skipping processing for path {}: no JWT token found", request.getRequestURI());
                return;
            }

            final String jwt = authHeader.substring(7);

            final String userEmail = jwtService.getUserName(jwt);
            log.debug("JWT filter processing request for path {}: user email {}", request.getRequestURI(), userEmail);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                log.debug("JWT filter processing request for path {}: no authentication found", request.getRequestURI());
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt) && userEmail.equals(userDetails.getUsername())) {
                    log.debug("JWT filter processing request for path {}: authentication successful", request.getRequestURI());
                    
                    // Extract tenant and user IDs from JWT
                    String tenantId = jwtService.getTenantIdFromJWT(jwt);
                    String userId = jwtService.getUserIdFromJWT(jwt);
                    
                    // Set TenantContext for this request thread
                    TenantContext.setContext(tenantId, userId);
                    log.debug("TenantContext set for tenant={}, user={}", tenantId, userId);
                    
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    log.debug("JWT filter processing request for path {}: authentication set", request.getRequestURI());
                }
            }
        } catch (JwtException | UsernameNotFoundException | IllegalArgumentException ex) {
            log.warn("JWT authentication failed for path {}: {}", request.getRequestURI(), ex.getMessage());
            SecurityContextHolder.clearContext();
        } finally {
            // Clear tenant context after request processing
            try {
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
                log.debug("TenantContext cleared after request");
            }
        }
    }

    /**
     * Check if the request path is a public endpoint that should bypass JWT authentication.
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
}
