-- Create company table
CREATE TABLE tbl_company (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    cuit VARCHAR(13) NOT NULL UNIQUE,
    legal_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_name ON tbl_company(name);
CREATE INDEX idx_company_cuit ON tbl_company(cuit);
