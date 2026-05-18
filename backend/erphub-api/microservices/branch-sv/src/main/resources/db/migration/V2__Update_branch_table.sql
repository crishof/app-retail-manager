-- Update branch table with new columns and company relationship
ALTER TABLE tbl_branch
    ADD COLUMN company_id UUID NOT NULL,
    ADD COLUMN legal_name VARCHAR(100),
    ADD COLUMN iva_status VARCHAR(50),
    ADD COLUMN cuit VARCHAR(13),
    ADD COLUMN start_of_activities DATE,
    ADD COLUMN gross_income_number VARCHAR(20),
    ADD COLUMN locality VARCHAR(100),
    ADD COLUMN postal_code VARCHAR(10),
    ADD COLUMN country VARCHAR(100),
    ADD COLUMN phone VARCHAR(20),
    ADD COLUMN email VARCHAR(150),
    ADD COLUMN website VARCHAR(255),
    ADD COLUMN point_of_sale INTEGER NOT NULL DEFAULT 1;

-- Add foreign key constraint
ALTER TABLE tbl_branch
    ADD CONSTRAINT fk_branch_company 
    FOREIGN KEY (company_id) 
    REFERENCES tbl_company(company_id) 
    ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_branch_cuit ON tbl_branch(cuit);
CREATE INDEX idx_branch_company_id ON tbl_branch(company_id);
