-- Flyway Migration: V4__Refactor_Invoice_Hierarchy_Sales_Purchase_Separation.sql
-- Purpose: Refactor Invoice model to support Sales vs Purchase hierarchy with JOINED inheritance
-- Date: 2026-06-01
-- Phase: PHASE 2 - Invoice Separation (P2)
-- Impact: Operation Service - Invoice entity restructuring with sales/purchase separation

-- =============================================================================
-- STEP 1: Create base invoices table (JOINED inheritance strategy)
-- =============================================================================
-- This table holds common fields for all invoice types (sales, purchase)
-- Uses JOINED inheritance: discriminator column + type-specific subtables

CREATE TABLE tbl_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_type VARCHAR(50) NOT NULL, -- 'SALES_INVOICE' or 'PURCHASE_INVOICE' (discriminator)
    
    -- Common fields
    number VARCHAR(20) NOT NULL, -- Sequential number (001/2026, 002/2026, etc.)
    document_type VARCHAR(20) NOT NULL, -- FACTURA, NOTA_CREDITO, NOTA_DEBITO, RESGUARDO
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Location & organization
    branch_id UUID NOT NULL,
    location_id UUID NOT NULL,
    
    -- Tax rates (configurable for Spain: 21%, 7%, 0%)
    net_value_0 NUMERIC(15, 2) DEFAULT 0,
    net_value_7 NUMERIC(15, 2) DEFAULT 0,
    net_value_21 NUMERIC(15, 2) DEFAULT 0,
    vat_0 NUMERIC(15, 2) DEFAULT 0,
    vat_7 NUMERIC(15, 2) DEFAULT 0,
    vat_21 NUMERIC(15, 2) DEFAULT 0,
    
    -- Totals
    subtotal NUMERIC(15, 2) NOT NULL,
    discount NUMERIC(15, 2) DEFAULT 0,
    tax_total NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    
    -- Withholdings & other taxes (if any, for future use)
    withholding_vat NUMERIC(15, 2) DEFAULT 0,
    retention_total NUMERIC(15, 2) DEFAULT 0,
    
    currency VARCHAR(3) DEFAULT 'EUR',
    observations TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ISSUED, CANCELLED, etc.
    
    -- Audit fields
    finalization_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    finalized_at TIMESTAMP,
    finalized_by_user_id UUID,
    
    -- Multi-tenancy
    tenant_id BIGINT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_tenant_id ON tbl_invoices(tenant_id);
CREATE INDEX idx_invoices_branch_id ON tbl_invoices(branch_id, tenant_id);
CREATE INDEX idx_invoices_number ON tbl_invoices(number, tenant_id);
CREATE INDEX idx_invoices_issue_date ON tbl_invoices(issue_date, tenant_id);
CREATE INDEX idx_invoices_type ON tbl_invoices(invoice_type, tenant_id);

-- =============================================================================
-- STEP 2: Create sales_invoices table (extends Invoice)
-- =============================================================================
-- Contains sales-specific fields (customer, payment, etc.)

CREATE TABLE tbl_sales_invoices (
    id UUID PRIMARY KEY,
    sale_id UUID UNIQUE NOT NULL, -- 1:1 relationship with Sale
    customer_id UUID NOT NULL,
    
    -- Payment fields
    payment_method VARCHAR(20), -- CASH, CARD, TRANSFER, CREDIT, etc.
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    
    -- Foreign key to base invoice
    CONSTRAINT fk_sales_invoices_invoice FOREIGN KEY (id) REFERENCES tbl_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_sales_invoices_customer ON tbl_sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_sale ON tbl_sales_invoices(sale_id);
CREATE INDEX idx_sales_invoices_payment_status ON tbl_sales_invoices(payment_status);

-- =============================================================================
-- STEP 3: Create purchase_invoices table (extends Invoice)
-- =============================================================================
-- Contains purchase-specific fields (supplier, retention, etc.)

CREATE TABLE tbl_purchase_invoices (
    id UUID PRIMARY KEY,
    supplier_id UUID NOT NULL,
    supplier_invoice_number VARCHAR(30),
    
    -- Retention fields (for supplier tax withholding)
    retention_percentage NUMERIC(5, 2) DEFAULT 0,
    retention_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- Foreign key to base invoice
    CONSTRAINT fk_purchase_invoices_invoice FOREIGN KEY (id) REFERENCES tbl_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchase_invoices_supplier ON tbl_purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_supplier_number ON tbl_purchase_invoices(supplier_invoice_number);

-- =============================================================================
-- STEP 4: Create invoice items tables
-- =============================================================================

CREATE TABLE tbl_sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_invoice_id UUID NOT NULL,
    product_id UUID,
    
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    tax_rate VARCHAR(3) NOT NULL, -- '0', '7', '21'
    line_total NUMERIC(15, 2) NOT NULL,
    
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sales_invoice_items_invoice FOREIGN KEY (sales_invoice_id) REFERENCES tbl_sales_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_sales_invoice_items_invoice ON tbl_sales_invoice_items(sales_invoice_id);
CREATE INDEX idx_sales_invoice_items_product ON tbl_sales_invoice_items(product_id);

CREATE TABLE tbl_purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_invoice_id UUID NOT NULL,
    product_id UUID,
    
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    tax_rate VARCHAR(3) NOT NULL, -- '0', '7', '21'
    line_total NUMERIC(15, 2) NOT NULL,
    
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_purchase_invoice_items_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES tbl_purchase_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchase_invoice_items_invoice ON tbl_purchase_invoice_items(purchase_invoice_id);
CREATE INDEX idx_purchase_invoice_items_product ON tbl_purchase_invoice_items(product_id);

-- =============================================================================
-- STEP 5: Create enums table for document types (for reference)
-- =============================================================================
-- Spain invoice document types: FACTURA, NOTA_CREDITO, NOTA_DEBITO, RESGUARDO

CREATE TABLE tbl_invoice_document_types (
    code VARCHAR(20) PRIMARY KEY,
    description VARCHAR(100),
    applies_to VARCHAR(50) -- 'SALES', 'PURCHASE', 'BOTH'
);

INSERT INTO tbl_invoice_document_types (code, description, applies_to) VALUES
    ('FACTURA', 'Factura estándar', 'BOTH'),
    ('NOTA_CREDITO', 'Nota de crédito', 'BOTH'),
    ('NOTA_DEBITO', 'Nota de débito', 'SALES'),
    ('RESGUARDO', 'Resguardo', 'SALES');

-- =============================================================================
-- STEP 6: Migrate existing tbl_supplier_invoice data to new structure
-- =============================================================================
-- Copy purchase invoices from old table to new structure

INSERT INTO tbl_invoices (
    id, invoice_type, number, document_type, issue_date, due_date,
    branch_id, location_id,
    net_value_21, vat_21, subtotal, tax_total, total_price,
    status, finalization_status, finalized_at, finalized_by_user_id,
    tenant_id, created_at, updated_at
)
SELECT
    id, 'PURCHASE_INVOICE' AS invoice_type,
    invoice_number, COALESCE(invoice_type, 'FACTURA') AS document_type,
    invoice_date AS issue_date, due_date,
    branch_id, location_id,
    net_value21, vat21, subtotal1, (vat21 + vat105 + vat27), total_price,
    'ISSUED' AS status, finalization_status, finalized_at, finalized_by_user_id,
    tenant_id, saved_date, saved_date
FROM tbl_supplier_invoice;

INSERT INTO tbl_purchase_invoices (
    id, supplier_id, supplier_invoice_number
)
SELECT
    id, supplier_id, invoice_number
FROM tbl_supplier_invoice;

-- =============================================================================
-- STEP 7: Migrate existing tbl_supplier_invoice items
-- =============================================================================

INSERT INTO tbl_purchase_invoice_items (
    id, purchase_invoice_id, product_id, description,
    quantity, unit_price, discount_percentage, tax_rate, line_total, order_index
)
SELECT
    ii.id, ii.invoice_id, NULL,
    ii.description,
    ii.quantity, ii.unit_price, 0, '21', ii.line_total, ii.order_index
FROM tbl_invoice_item ii
WHERE ii.invoice_id IN (SELECT id FROM tbl_supplier_invoice);

-- =============================================================================
-- STEP 8: Drop old invoice tables (after successful migration)
-- =============================================================================
-- NOTE: Uncomment these lines ONLY after confirming data migration is successful
-- ALTER TABLE tbl_invoice_item DROP CONSTRAINT IF EXISTS fk_invoice_item_invoice;
-- ALTER TABLE tbl_other_concept DROP CONSTRAINT IF EXISTS fk_other_concept_invoice;
-- DROP TABLE IF EXISTS tbl_invoice_item;
-- DROP TABLE IF EXISTS tbl_other_concept;
-- DROP TABLE IF EXISTS tbl_supplier_invoice;

-- =============================================================================
-- VERIFICATION: Check data integrity
-- =============================================================================

-- SELECT COUNT(*) as total_invoices FROM tbl_invoices;
-- SELECT invoice_type, COUNT(*) FROM tbl_invoices GROUP BY invoice_type;
-- SELECT COUNT(*) as sales_invoices FROM tbl_sales_invoices;
-- SELECT COUNT(*) as purchase_invoices FROM tbl_purchase_invoices;
