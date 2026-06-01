-- Flyway Migration: V3__Refactor_User_FullName_To_FirstName_LastName.sql
-- Purpose: Refactor User model from fullName to firstName + lastName
-- Date: 2026-06-01
-- Phase: PHASE 1 - Foundation (P1)
-- Impact: Auth Service - User entity restructuring

-- =============================================================================
-- STEP 1: Add new columns firstName and lastName
-- =============================================================================

ALTER TABLE tbl_users 
ADD COLUMN first_name VARCHAR(50) DEFAULT '' NOT NULL,
ADD COLUMN last_name VARCHAR(50) DEFAULT '' NOT NULL;

-- =============================================================================
-- STEP 2: Migrate data from fullName to firstName and lastName
-- =============================================================================

-- Split fullName into firstName and lastName
UPDATE tbl_users 
SET 
  first_name = CASE 
    WHEN POSITION(' ' IN full_name) > 0 
    THEN TRIM(LEFT(full_name, POSITION(' ' IN full_name) - 1))
    ELSE full_name
  END,
  last_name = CASE 
    WHEN POSITION(' ' IN full_name) > 0 
    THEN TRIM(SUBSTRING(full_name, POSITION(' ' IN full_name) + 1))
    ELSE ''
  END
WHERE full_name IS NOT NULL AND full_name != '';

-- For users with single name, keep lastName empty (or use space placeholder)
UPDATE tbl_users 
SET last_name = 'User'
WHERE first_name IS NOT NULL AND (last_name = '' OR last_name IS NULL);

-- =============================================================================
-- STEP 3: Remove old fullName column
-- =============================================================================

ALTER TABLE tbl_users DROP COLUMN full_name;

-- =============================================================================
-- STEP 4: Add indexes for search performance
-- =============================================================================

CREATE INDEX idx_users_first_name ON tbl_users(first_name);
CREATE INDEX idx_users_last_name ON tbl_users(last_name);
CREATE INDEX idx_users_first_last_name ON tbl_users(first_name, last_name);

-- =============================================================================
-- VERIFICATION: Ensure data integrity
-- =============================================================================

-- All users must have firstName and lastName
-- SELECT COUNT(*) as invalid_users FROM tbl_users 
-- WHERE first_name IS NULL OR last_name IS NULL OR first_name = '';
