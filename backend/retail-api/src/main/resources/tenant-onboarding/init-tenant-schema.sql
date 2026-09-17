-- Tenant Initialization Script - Schema Setup for New Customer Onboarding
-- Purpose: Initialize tenant-isolated data and configurations for new customers
-- Date: 2026-05-29
-- Phase: Phase 3 Day 9 - Multi-Tenancy Support
--
-- USAGE:
--   This script should be executed during customer onboarding to set up the initial
--   tenant environment with default configurations, companies, branches, and roles.
--
--   Example in Java service:
--   ```
--   @Service
--   public class TenantOnboardingService {
--       @Autowired private JdbcTemplate jdbcTemplate;
--       
--       public void initializeTenantSchema(Long tenantId, String tenantName) {
--           String sql = ResourceUtils.getResourceAsString("tenant-onboarding/init-tenant-schema.sql");
--           // Replace placeholders and execute
--           String processedSql = sql.replace(":tenantId", tenantId.toString())
--                                     .replace(":tenantName", tenantName);
--           jdbcTemplate.update(processedSql);
--       }
--   }
--   ```

-- =============================================================================
-- IMPORTANT: Replace these placeholders before execution
-- =============================================================================
-- :TENANT_ID       -> Numeric tenant ID (e.g., 1001)
-- :TENANT_NAME     -> Tenant/Company name (e.g., 'Acme Corp')
-- :ADMIN_USER_UUID -> UUID for admin user (generate new UUID)
-- :COMPANY_UUID    -> UUID for default company (generate new UUID)
-- :BRANCH_UUID     -> UUID for default branch (generate new UUID)

-- =============================================================================
-- STEP 1: Create Default Company (if not exists in multi-tenant schema)
-- =============================================================================
-- Note: Companies may be managed separately; this is a placeholder for future multi-schema approach

INSERT INTO tbl_companies (id, name, cuit, tenant_id, created_at, updated_at)
VALUES (
    ':COMPANY_UUID'::uuid,
    ':TENANT_NAME',
    '00000000000',  -- Placeholder CUIT - should be set during onboarding
    :TENANT_ID,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 2: Create Default Branch for the Tenant
-- =============================================================================

INSERT INTO tbl_branches (id, name, company_id, tenant_id, created_at, updated_at)
VALUES (
    ':BRANCH_UUID'::uuid,
    'Main Branch',
    ':COMPANY_UUID'::uuid,
    :TENANT_ID,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Create Default Location/Warehouse for Inventory
-- =============================================================================

INSERT INTO tbl_locations (id, name, branch_id, tenant_id, location_type, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Default Warehouse',
    ':BRANCH_UUID'::uuid,
    :TENANT_ID,
    'WAREHOUSE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 4: Initialize Default Settings (if settings table exists)
-- =============================================================================

INSERT INTO tbl_tenant_settings (id, tenant_id, setting_key, setting_value, created_at, updated_at)
VALUES 
    (gen_random_uuid(), :TENANT_ID, 'currency', 'ARS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'tax_regime', 'IVA_RESPONSABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'fiscal_address', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'allow_fractional_units', 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'require_serial_number', 'false', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 5: Initialize Default Payment Methods
-- =============================================================================

INSERT INTO tbl_payment_methods (id, tenant_id, name, description, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), :TENANT_ID, 'CASH', 'Cash Payment', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'CREDIT_CARD', 'Credit Card', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'DEBIT_CARD', 'Debit Card', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'BANK_TRANSFER', 'Bank Transfer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'CHECK', 'Check', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 6: Initialize Default Document Types
-- =============================================================================

INSERT INTO tbl_document_types (id, tenant_id, code, name, description, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), :TENANT_ID, 'INVOICE', 'Invoice', 'Sales Invoice', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'CREDIT_NOTE', 'Credit Note', 'Sales Credit Note', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'DEBIT_NOTE', 'Debit Note', 'Sales Debit Note', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'PURCHASE_INVOICE', 'Purchase Invoice', 'Purchase Invoice', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), :TENANT_ID, 'QUOTATION', 'Quotation', 'Sales Quotation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 7: Log Tenant Initialization Event
-- =============================================================================

INSERT INTO tbl_audit_log (id, tenant_id, entity_type, entity_id, action, changes, performed_by_id, created_at)
VALUES (
    gen_random_uuid(),
    :TENANT_ID,
    'TENANT',
    ':TENANT_ID'::text,
    'INITIALIZED',
    'New tenant initialized with default configuration',
    ':ADMIN_USER_UUID'::uuid,
    CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 8: Verify Tenant Setup Completeness
-- =============================================================================

-- Run these SELECT queries to verify all components are in place:

-- SELECT COUNT(*) as company_count FROM tbl_companies WHERE tenant_id = :TENANT_ID;
-- SELECT COUNT(*) as branch_count FROM tbl_branches WHERE tenant_id = :TENANT_ID;
-- SELECT COUNT(*) as location_count FROM tbl_locations WHERE tenant_id = :TENANT_ID;
-- SELECT COUNT(*) as settings_count FROM tbl_tenant_settings WHERE tenant_id = :TENANT_ID;
-- SELECT COUNT(*) as payment_count FROM tbl_payment_methods WHERE tenant_id = :TENANT_ID;
-- SELECT COUNT(*) as doc_type_count FROM tbl_document_types WHERE tenant_id = :TENANT_ID;

-- Expected output for successful initialization:
-- company_count: 1
-- branch_count: 1
-- location_count: 1
-- settings_count: 5
-- payment_count: 5
-- doc_type_count: 5
