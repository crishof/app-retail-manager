-- Flyway Migration V2: Create audit trail and document versioning tables
-- For fiscal compliance and forensic analysis support
-- Created: Phase 4 Day 13
-- Multi-tenant scoped with indexes for compliance queries

-- Create audit log table (append-only, immutable)
CREATE TABLE tbl_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    description TEXT,
    performed_by_user_id UUID,
    source_ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_for_finalized_document BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id) REFERENCES tbl_tenant (id) ON DELETE RESTRICT,
    CONSTRAINT check_audit_action CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'FINALIZE', 'CANCEL', 'APPROVE', 'REJECT', 
        'RESTORE', 'STATUS_CHANGE', 'BULK_UPDATE', 'SYSTEM_ACTION', 'DATA_EXPORT', 'REPORT_GENERATED'
    ))
);

-- Indexes for efficient compliance queries
CREATE INDEX idx_audit_log_tenant ON tbl_audit_log(tenant_id);
CREATE INDEX idx_audit_log_entity ON tbl_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_timestamp ON tbl_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user ON tbl_audit_log(performed_by_user_id);
CREATE INDEX idx_audit_log_finalized_doc ON tbl_audit_log(is_for_finalized_document) WHERE is_for_finalized_document = TRUE;

-- Create document versioning table (immutable snapshots)
CREATE TABLE tbl_document_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_id VARCHAR(255) NOT NULL,
    version_number INTEGER NOT NULL,
    document_snapshot JSONB NOT NULL,
    change_summary TEXT,
    change_reason VARCHAR(255),
    created_by_user_id UUID NOT NULL,
    created_by_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_current_version BOOLEAN DEFAULT TRUE,
    is_finalized_version BOOLEAN DEFAULT FALSE,
    snapshot_hash VARCHAR(64) NOT NULL,
    CONSTRAINT fk_document_version_tenant FOREIGN KEY (tenant_id) REFERENCES tbl_tenant (id) ON DELETE RESTRICT,
    CONSTRAINT unique_document_version UNIQUE (tenant_id, document_type, document_id, version_number)
);

-- Indexes for efficient document version queries
CREATE INDEX idx_document_version_tenant ON tbl_document_version(tenant_id);
CREATE INDEX idx_document_version_document ON tbl_document_version(document_type, document_id);
CREATE INDEX idx_document_version_current ON tbl_document_version(is_current_version) WHERE is_current_version = TRUE;
CREATE INDEX idx_document_version_finalized ON tbl_document_version(is_finalized_version) WHERE is_finalized_version = TRUE;
CREATE INDEX idx_document_version_created ON tbl_document_version(created_at DESC);

-- Add new columns to Invoice table for finalization tracking
ALTER TABLE tbl_supplier_invoice 
ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(50) NOT NULL DEFAULT 'IVA_RESPONSABLE',
ADD COLUMN IF NOT EXISTS finalization_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS finalized_by_user_id UUID;

-- Add constraints to Invoice table
ALTER TABLE tbl_supplier_invoice ADD CONSTRAINT check_finalization_status 
    CHECK (finalization_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'FINALIZED', 'CANCELED'));

-- Add index for finalization queries
CREATE INDEX idx_invoice_finalization_status ON tbl_supplier_invoice(finalization_status);
CREATE INDEX idx_invoice_finalized_at ON tbl_supplier_invoice(finalized_at) WHERE finalized_at IS NOT NULL;

-- Grant appropriate permissions (if using row-level security)
-- GRANT SELECT, INSERT ON tbl_audit_log TO audit_user;
-- GRANT SELECT, INSERT ON tbl_document_version TO audit_user;
