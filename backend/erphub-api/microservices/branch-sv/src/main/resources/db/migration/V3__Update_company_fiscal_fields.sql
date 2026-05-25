ALTER TABLE tbl_company
    ADD COLUMN IF NOT EXISTS iva_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS start_of_activities DATE,
    ADD COLUMN IF NOT EXISTS gross_income_number VARCHAR(20);
