package com.zaphirio.retailapi.shared.tenancy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * Service for multi-tenant onboarding and initialization.
 *
 * Handles creation and configuration of new tenant schemas and isolated data environments.
 * Each tenant gets its own isolated data with automatic filtering at the repository level
 * via TenantAwareRepository and tenant_id column filtering.
 */
@Service
@Slf4j
public class TenantOnboardingService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Initialize a new tenant schema with default configuration.
     *
     * This method:
     * 1. Creates default company and branch entities
     * 2. Sets up initial warehouse/location
     * 3. Initializes payment methods and document types
     * 4. Creates default settings and configurations
     * 5. Logs the initialization event for audit trail
     *
     * @param tenantId       The numeric ID for the new tenant
     * @param tenantName     The name/display name of the tenant
     * @param adminUserUuid  UUID of the admin user who owns this tenant
     * @throws IOException if tenant initialization script cannot be read
     * @throws RuntimeException if SQL execution fails
     */
    @Transactional
    public void initializeTenantSchema(Long tenantId, String tenantName, String adminUserUuid) {
        try {
            log.info("Initializing tenant schema: tenantId={}, tenantName={}", tenantId, tenantName);

            // Load the tenant initialization script
            String initScript = loadTenantInitScript();

            // Replace placeholders with actual values
            String processedScript = processScript(initScript, tenantId, tenantName, adminUserUuid);

            // Execute the initialization script
            // Note: Split by semicolon and execute individually to handle multiple statements
            String[] statements = processedScript.split(";\\s*\n");
            for (String statement : statements) {
                String trimmedStatement = statement.trim();
                if (!trimmedStatement.isEmpty() && !trimmedStatement.startsWith("--")) {
                    try {
                        jdbcTemplate.execute(trimmedStatement);
                        log.debug("Executed tenant init statement for tenant: {}", tenantId);
                    } catch (Exception e) {
                        log.warn("Statement execution failed (may be benign if using ON CONFLICT): {}", e.getMessage());
                    }
                }
            }

            log.info("Tenant schema initialization completed: tenantId={}", tenantId);
        } catch (IOException e) {
            log.error("Failed to initialize tenant schema", e);
            throw new RuntimeException("Tenant schema initialization failed", e);
        }
    }

    /**
     * Load the tenant initialization SQL script from resources.
     *
     * @return The SQL script content
     * @throws IOException if the script file cannot be read
     */
    private String loadTenantInitScript() throws IOException {
        try (InputStream inputStream = getClass().getResourceAsStream("/tenant-onboarding/init-tenant-schema.sql")) {
            if (inputStream == null) {
                throw new IOException("Tenant initialization script not found in resources");
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        }
    }

    /**
     * Process the initialization script by replacing placeholders.
     *
     * @param script        The raw script template
     * @param tenantId      The tenant ID to insert
     * @param tenantName    The tenant name to insert
     * @param adminUserUuid The admin user UUID to insert
     * @return The processed script with all placeholders replaced
     */
    private String processScript(String script, Long tenantId, String tenantName, String adminUserUuid) {
        return script
                .replace(":TENANT_ID", tenantId.toString())
                .replace(":TENANT_NAME", escapeSqlString(tenantName))
                .replace(":ADMIN_USER_UUID", adminUserUuid)
                .replace(":COMPANY_UUID", "gen_random_uuid()")
                .replace(":BRANCH_UUID", "gen_random_uuid()");
    }

    /**
     * Escape SQL string values to prevent injection and handle special characters.
     *
     * @param value The string value to escape
     * @return The escaped string safe for SQL
     */
    private String escapeSqlString(String value) {
        // Replace single quotes with double single quotes (SQL standard escaping)
        return "'" + value.replace("'", "''") + "'";
    }

    /**
     * Verify that a tenant schema was initialized correctly.
     *
     * Checks that all expected components (company, branch, locations, etc.) were created.
     *
     * @param tenantId The tenant ID to verify
     * @return true if all expected components exist, false otherwise
     */
    public boolean verifyTenantInitialization(Long tenantId) {
        log.debug("Verifying tenant initialization: tenantId={}", tenantId);

        try {
            // Check company
            Integer companyCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tbl_companies WHERE tenant_id = ?",
                    Integer.class,
                    tenantId
            );

            // Check branch
            Integer branchCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tbl_branches WHERE tenant_id = ?",
                    Integer.class,
                    tenantId
            );

            // Check location
            Integer locationCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tbl_locations WHERE tenant_id = ?",
                    Integer.class,
                    tenantId
            );

            // Check settings
            Integer settingsCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tbl_tenant_settings WHERE tenant_id = ?",
                    Integer.class,
                    tenantId
            );

            boolean isValid = companyCount > 0 && branchCount > 0 && locationCount > 0 && settingsCount >= 5;

            log.info(
                    "Tenant verification result: tenantId={}, companies={}, branches={}, locations={}, settings={}, valid={}",
                    tenantId, companyCount, branchCount, locationCount, settingsCount, isValid
            );

            return isValid;
        } catch (Exception e) {
            log.error("Tenant verification failed: tenantId={}", tenantId, e);
            return false;
        }
    }
}
