package com.zaphirio.retailapi.shared.security;

import lombok.extern.slf4j.Slf4j;

/**
 * ThreadLocal-based context holder for tenant and user information.
 * 
 * Stores tenant ID and user ID for the current request thread.
 * Must be cleared after request processing to prevent thread pool leaks.
 */
@Slf4j
public final class TenantContext {
    private static final ThreadLocal<String> tenantIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userIdHolder = new ThreadLocal<>();
    
    private TenantContext() {
        // Utility class
    }
    
    /**
     * Set tenant and user context for current thread.
     * 
     * @param tenantId The tenant ID (required, cannot be null)
     * @param userId   The user ID (required, cannot be null)
     * @throws IllegalArgumentException if tenantId or userId is null
     */
    public static void setContext(String tenantId, String userId) {
        if (tenantId == null) {
            log.warn("Attempt to set null tenantId");
            throw new IllegalArgumentException("Tenant ID cannot be null");
        }
        if (userId == null) {
            log.warn("Attempt to set null userId");
            throw new IllegalArgumentException("User ID cannot be null");
        }
        
        tenantIdHolder.set(tenantId);
        userIdHolder.set(userId);
        log.debug("TenantContext set: tenant={}, user={}", tenantId, userId);
    }
    
    /**
     * Get current tenant ID from context.
     * 
     * @return The tenant ID for current thread
     * @throws IllegalStateException if tenant ID not set in context
     */
    public static String getTenantId() {
        String tenantId = tenantIdHolder.get();
        if (tenantId == null) {
            throw new IllegalStateException("Tenant ID not set in context");
        }
        return tenantId;
    }
    
    /**
     * Get current user ID from context.
     * 
     * @return The user ID for current thread
     * @throws IllegalStateException if user ID not set in context
     */
    public static String getUserId() {
        String userId = userIdHolder.get();
        if (userId == null) {
            throw new IllegalStateException("User ID not set in context");
        }
        return userId;
    }
    
    /**
     * Check if tenant context is set.
     * 
     * @return true if both tenant and user IDs are set
     */
    public static boolean isSet() {
        return tenantIdHolder.get() != null && userIdHolder.get() != null;
    }
    
    /**
     * Clear tenant context from current thread.
     * MUST be called in finally block after request processing
     * to prevent thread pool leaks.
     */
    public static void clear() {
        log.debug("Clearing TenantContext");
        tenantIdHolder.remove();
        userIdHolder.remove();
    }
}
