-- Flyway Migration: V1__Add_tenant_multi_tenancy_support.sql
-- Purpose: Add NOT NULL constraints to tenant_id columns for multi-tenant data isolation
-- Date: 2026-05-29
-- Phase: Phase 3 Day 9 - Multi-Tenancy Foundation

-- =============================================================================
-- STEP 1: Add NOT NULL Constraints to tenant_id columns
-- =============================================================================

-- Users table - tenant_id column (auth domain)
ALTER TABLE tbl_users ALTER COLUMN tenant_id SET NOT NULL;

-- Products table - tenant_id column (catalog domain)
ALTER TABLE tbl_products ALTER COLUMN tenant_id SET NOT NULL;

-- Brands table - tenant_id column (catalog domain)
ALTER TABLE tbl_brands ALTER COLUMN tenant_id SET NOT NULL;

-- Categories table - tenant_id column (catalog domain)
ALTER TABLE tbl_categories ALTER COLUMN tenant_id SET NOT NULL;

-- Stock table - tenant_id column (inventory domain)
ALTER TABLE tbl_stocks ALTER COLUMN tenant_id SET NOT NULL;

-- Customers table - tenant_id column (party domain)
ALTER TABLE tbl_customers ALTER COLUMN tenant_id SET NOT NULL;

-- Suppliers table - tenant_id column (party domain)
ALTER TABLE tbl_suppliers ALTER COLUMN tenant_id SET NOT NULL;

-- Invoices table - tenant_id column (operations domain)
ALTER TABLE tbl_invoices ALTER COLUMN tenant_id SET NOT NULL;

-- Sales table - tenant_id column (operations domain)
ALTER TABLE tbl_sales ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================================================
-- STEP 2: Create Indexes on tenant_id columns for query performance
-- =============================================================================

CREATE INDEX idx_users_tenant_id ON tbl_users(tenant_id);
CREATE INDEX idx_products_tenant_id ON tbl_products(tenant_id);
CREATE INDEX idx_brands_tenant_id ON tbl_brands(tenant_id);
CREATE INDEX idx_categories_tenant_id ON tbl_categories(tenant_id);
CREATE INDEX idx_stocks_tenant_id ON tbl_stocks(tenant_id);
CREATE INDEX idx_customers_tenant_id ON tbl_customers(tenant_id);
CREATE INDEX idx_suppliers_tenant_id ON tbl_suppliers(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON tbl_invoices(tenant_id);
CREATE INDEX idx_sales_tenant_id ON tbl_sales(tenant_id);

-- =============================================================================
-- STEP 3: Create composite indexes for common query patterns
-- =============================================================================
-- These are useful for Specification-based queries filtering by tenant + other fields

CREATE INDEX idx_products_tenant_deleted ON tbl_products(tenant_id, deleted_at);
CREATE INDEX idx_brands_tenant_deleted ON tbl_brands(tenant_id, deleted_at);
CREATE INDEX idx_categories_tenant_deleted ON tbl_categories(tenant_id, deleted_at);
CREATE INDEX idx_customers_tenant_deleted ON tbl_customers(tenant_id, deleted_at);
CREATE INDEX idx_suppliers_tenant_deleted ON tbl_suppliers(tenant_id, deleted_at);

-- =============================================================================
-- STEP 4: Add foreign key constraint to tbl_tenants (once multi-tenant schema is created)
-- =============================================================================
-- This enforces referential integrity: tenant_id must exist in tbl_tenants.id
-- Note: This migration assumes tbl_tenants table exists; if not, add after tenant table creation

-- ALTER TABLE tbl_users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_products ADD CONSTRAINT fk_products_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_brands ADD CONSTRAINT fk_brands_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_categories ADD CONSTRAINT fk_categories_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_stocks ADD CONSTRAINT fk_stocks_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_customers ADD CONSTRAINT fk_customers_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_suppliers ADD CONSTRAINT fk_suppliers_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_invoices ADD CONSTRAINT fk_invoices_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
-- ALTER TABLE tbl_sales ADD CONSTRAINT fk_sales_tenant_id FOREIGN KEY (tenant_id) REFERENCES tbl_tenants(id) ON DELETE CASCADE;
