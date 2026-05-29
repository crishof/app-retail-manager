# Flyway Migration Validation Guide

## Overview
This guide provides step-by-step instructions for validating that Flyway migrations execute cleanly and correctly enforce multi-tenant data isolation at the database level.

## Pre-Migration Checklist

### 1. Database Connection
```bash
# Verify PostgreSQL is running
psql --version

# Connect to database
psql -h localhost -U postgres -d retail_api

# Check current tables
\dt
```

### 2. Check Existing tenant_id Columns
Before migration, verify that tenant_id columns exist as NULLABLE:

```sql
-- Check User table tenant_id
\d tbl_users
-- Expected: tenant_id | bigint | (nullable)

-- Check Product table tenant_id
\d tbl_products
-- Expected: tenant_id | bigint | (nullable)

-- Check all entities
SELECT table_name, column_name, is_nullable 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
ORDER BY table_name;
```

## Migration Execution

### Step 1: Run Application with Flyway
When the application starts, Flyway automatically:
1. Creates `flyway_schema_history` table
2. Detects existing schema
3. Runs pending migrations (V1__Add_tenant_multi_tenancy_support.sql)

```bash
cd backend/erphub-api/microservices/retail-api
mvn spring-boot:run
```

**Expected Console Output:**
```
[INFO] ... Flyway configuration is enabled
[INFO] ... Flyway migrations directory: classpath:db/migration/
[INFO] ... Validating all pending migrations
[INFO] ... V1__Add_tenant_multi_tenancy_support.sql pending for execution
[INFO] ... Successfully executed migration V1 (SQL script)
[INFO] ... Execution Time: 245ms
[INFO] ... Hibernate JPA: 0 DDL scripts executed
[INFO] ... Application startup complete
```

### Step 2: Verify Migration Applied
Connect to database and check that migration history is recorded:

```sql
-- Check migration history
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;

-- Expected output:
-- | success | 1 | V1__Add_tenant_multi_tenancy_support | SQL | 432 | ... | CURRENT_TIMESTAMP |
```

## Post-Migration Validation

### Validation 1: NOT NULL Constraints Applied

```sql
-- Check all tenant_id columns are NOT NULL
SELECT 
    table_name, 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns
WHERE column_name = 'tenant_id'
ORDER BY table_name;

-- Expected output for all rows: is_nullable = NO
```

**Expected Results:**
```
table_name            | column_name | is_nullable | data_type
----------------------+-------------+-------------+----------
tbl_users             | tenant_id   | NO          | bigint
tbl_products          | tenant_id   | NO          | bigint
tbl_brands            | tenant_id   | NO          | bigint
tbl_categories        | tenant_id   | NO          | bigint
tbl_stocks            | tenant_id   | NO          | bigint
tbl_customers         | tenant_id   | NO          | bigint
tbl_suppliers         | tenant_id   | NO          | bigint
tbl_invoices          | tenant_id   | NO          | bigint
tbl_sales             | tenant_id   | NO          | bigint
```

**Test Insert with NULL tenant_id (should fail):**
```sql
-- This should fail with NOT NULL constraint violation
INSERT INTO tbl_users (id, email, full_name, role, status, created_at, updated_at, tenant_id)
VALUES (gen_random_uuid(), 'test@test.com', 'Test', 'ADMIN', 'ACTIVE', now(), now(), NULL);

-- Expected error:
-- ERROR: null value in column "tenant_id" violates not-null constraint
```

### Validation 2: Indexes Created

```sql
-- List all indexes on tenant_id columns
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%tenant%'
ORDER BY tablename;

-- Expected output: 18 indexes (9 single-column + 9 composite)
```

**Expected Results:**
```
tablename       | indexname                    | indexdef
----------------+------------------------------+------------------------
tbl_users       | idx_users_tenant_id          | CREATE INDEX idx_users_tenant_id ON ...
tbl_users       | idx_users_tenant_id_deleted  | CREATE INDEX idx_users_tenant_id_deleted ON ...
... (16 more indexes)
```

**Test Index Performance:**
```sql
-- Compare query plans before/after
EXPLAIN ANALYZE 
SELECT * FROM tbl_users WHERE tenant_id = 1001;

-- Expected: Index Scan using idx_users_tenant_id (NOT Seq Scan)
-- Expected execution time: <5ms for millions of rows
```

### Validation 3: Composite Indexes Work

```sql
-- Test composite index on soft-delete + tenant
EXPLAIN ANALYZE 
SELECT * FROM tbl_products 
WHERE tenant_id = 1001 AND deleted_at IS NULL;

-- Expected: Bitmap Index Scan or Index Scan using composite index
-- Expected time: <2ms even with millions of rows
```

### Validation 4: Data Integrity

```sql
-- Verify existing tenant_id data wasn't corrupted
SELECT 
    table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT tenant_id) as unique_tenant_ids,
    MIN(tenant_id) as min_tenant_id,
    MAX(tenant_id) as max_tenant_id
FROM information_schema.tables
WHERE table_name IN ('tbl_users', 'tbl_products', 'tbl_brands', 'tbl_categories', 
                      'tbl_stocks', 'tbl_customers', 'tbl_suppliers', 'tbl_invoices', 'tbl_sales')
GROUP BY table_name
ORDER BY table_name;

-- Expected: All rows have tenant_id set (NO NULLs), data unchanged
```

## Testing Migration Idempotency

Flyway should prevent re-running already executed migrations.

### Test 1: Restart Application
```bash
# Stop application (Ctrl+C)
# Restart with:
mvn spring-boot:run

# Expected console output:
# [INFO] ... Flyway validation: 1 applied (V1), 0 pending
# [INFO] ... No migrations to execute
# [INFO] ... Application startup complete
```

### Test 2: Force Migration Validation
```sql
-- Check migration status in database
SELECT version, description, type, success 
FROM flyway_schema_history 
ORDER BY installed_rank;

-- Expected: V1 marked as success, cannot be re-run
```

## Rollback Scenario (If Issues Detected)

### If Migration Failed:
1. Check Flyway error logs
2. Fix the SQL issue in V1__Add_tenant_multi_tenancy_support.sql
3. Delete failed migration from flyway_schema_history:
   ```sql
   DELETE FROM flyway_schema_history WHERE version = 1;
   ```
4. Fix the SQL script
5. Restart application - Flyway will re-execute

### If Data Corruption Detected:
1. Restore database backup (taken before migration)
2. Investigate root cause
3. Update migration script if needed
4. Retest in staging environment

## Production Deployment Checklist

- [ ] Flyway migrations tested in staging environment
- [ ] Database backup taken before running migration
- [ ] Migration execution time < 5 minutes (expected: <1 min)
- [ ] All 9 entities have NOT NULL tenant_id constraints
- [ ] All 18 indexes created successfully
- [ ] No query performance degradation detected
- [ ] Monitoring alerts configured for migration failures
- [ ] Rollback plan documented and tested

## Performance Validation

### Before Migration:
```bash
# Run query performance baseline
time psql -h localhost -U postgres retail_api -c \
  "SELECT COUNT(*) FROM tbl_users WHERE tenant_id = 1001;" 
# Expected: ~500ms for 10M rows (full scan)
```

### After Migration:
```bash
# Run same query with index in place
time psql -h localhost -U postgres retail_api -c \
  "SELECT COUNT(*) FROM tbl_users WHERE tenant_id = 1001;" 
# Expected: ~5ms for 10M rows (index scan)
# Improvement: 100x faster
```

## Troubleshooting

### Issue 1: "duplicate key value violates unique constraint"
- **Cause**: Duplicate tenant_id values caused by previous NULL values
- **Solution**: Clean up data before migration or adjust constraint

### Issue 2: "Flyway migration failed - unable to alter table"
- **Cause**: Existing NOT NULL constraints or locks
- **Solution**: Check table locks: `SELECT * FROM pg_stat_user_tables WHERE relname LIKE 'tbl_%';`

### Issue 3: "Index already exists"
- **Cause**: Migration ran partially before
- **Solution**: Check flyway_schema_history; may need manual cleanup

## Verification Commands Summary

```bash
# 1. Connect to database
psql -h localhost -U postgres -d retail_api

# 2. Check migration applied
SELECT * FROM flyway_schema_history;

# 3. Verify NOT NULL constraints
SELECT table_name, column_name, is_nullable 
FROM information_schema.columns 
WHERE column_name = 'tenant_id';

# 4. Check indexes created
SELECT * FROM pg_indexes WHERE indexname LIKE '%tenant%';

# 5. Test index usage
EXPLAIN ANALYZE SELECT * FROM tbl_users WHERE tenant_id = 1001;

# 6. Verify query performance
EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM tbl_products WHERE tenant_id = 1001;
```

**Expected time for all validations: 5-10 minutes**
