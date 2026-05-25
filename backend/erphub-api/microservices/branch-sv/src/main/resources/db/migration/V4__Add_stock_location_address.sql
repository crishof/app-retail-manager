ALTER TABLE tbl_stock_location
    ADD COLUMN IF NOT EXISTS address VARCHAR(255);
