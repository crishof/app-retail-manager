# Production MVP Checklist

**Before selling to first customers, verify ALL items below**

---

## Security Verification

### Authentication & Authorization
- [ ] All endpoints except `/auth/*`, `/actuator/health`, `/swagger-ui/**`, `/v3/api-docs/**` require JWT
- [ ] JWT token validation working (expiration, signature)
- [ ] RBAC properly enforced for all roles (ADMIN, SALES, INVENTORY, FINANCE, VIEWER)
- [ ] Password complexity enforced (12+ chars, mixed case, numbers, symbols)
- [ ] No credentials in logs or error messages
- [ ] Security headers configured (HSTS, X-Frame-Options, X-Content-Type-Options, CSP)

### Multi-Tenancy
- [ ] Tenant isolation verified (Tenant A cannot see Tenant B data)
- [ ] TenantContext set from JWT on every request
- [ ] All repositories filtered by tenantId
- [ ] Schema separation working for each tenant
- [ ] Cross-tenant data access returns 403 Forbidden

### API Security
- [ ] CORS whitelist configured (no `*` origins)
- [ ] Actuator endpoints restricted to ADMIN role only
- [ ] File upload validation (type, size, content)
- [ ] No SQL injection vulnerabilities (all queries parameterized)
- [ ] API rate limiting enabled (10-100 requests/minute)
- [ ] Error messages don't expose internal details

---

## Data Integrity Verification

### Financial/Fiscal Data
- [ ] Invoices immutable after APPROVED status
- [ ] Invoice hash chaining implemented
- [ ] CashMovements immutable after creation
- [ ] Audit logs created for all financial operations
- [ ] No manual SQL edits possible for financial data
- [ ] Invoice numbering sequential, unique per tenant

### Inventory Management
- [ ] Stock movements atomic (SERIALIZABLE isolation)
- [ ] No race condition in concurrent stock deductions
- [ ] Load tested with 100+ concurrent sales
- [ ] Stock can never go negative without explicit permission
- [ ] Stock movements logged with user, timestamp, reason

### Transaction Boundaries
- [ ] Sale creation → Stock deduction is atomic
- [ ] Invoice creation → Cash movement creation is atomic
- [ ] No dangling references (no orphaned sale items)
- [ ] Foreign key constraints enforced
- [ ] Cascade delete validated (no accidental deletes)

---

## Database & Migrations

### Migrations
- [ ] Flyway migrations versioned and tested
- [ ] Initial schema migrated successfully
- [ ] Tenant schema template created
- [ ] Rollback procedure tested (can downgrade versions)
- [ ] Zero-downtime migration strategy documented

### Data Integrity
- [ ] Database constraints enforced (NOT NULL, UNIQUE, FK)
- [ ] Indexes created for performance queries
- [ ] Backup procedure tested (can restore from backup)
- [ ] Point-in-time recovery possible
- [ ] No missing foreign keys in existing data

---

## Performance & Scalability

### Load Testing
- [ ] 1000 products can load in < 2 seconds
- [ ] 100 concurrent users = no errors
- [ ] 100 concurrent sales (stock deduction) = no data loss
- [ ] N+1 query problem eliminated (verified with query logging)
- [ ] Database connection pool tuned

### Observability
- [ ] Logs structured (JSON format, all requests logged)
- [ ] Slow queries logged (> 1 second)
- [ ] Request tracing enabled (correlation IDs)
- [ ] Metrics available (/actuator/metrics)
- [ ] Memory usage stable over time (no leaks)

---

## Deployment & Operations

### Docker
- [ ] Docker image builds successfully
- [ ] Docker image scanned for vulnerabilities
- [ ] Docker Compose works end-to-end
- [ ] Health checks respond correctly
- [ ] Graceful shutdown on SIGTERM
- [ ] No hardcoded credentials in image

### Environment Separation
- [ ] Development config separate from production
- [ ] Database URLs configurable via env vars
- [ ] Secret management solution chosen (env vars or vault)
- [ ] All secrets documented (not in git)
- [ ] Secrets rotation procedure documented

### Monitoring
- [ ] Health check endpoint `/actuator/health` working
- [ ] Error rate monitoring configured
- [ ] Request latency monitoring configured
- [ ] Database connection monitoring configured
- [ ] Disk space monitoring configured
- [ ] CPU usage monitoring configured

---

## Business Logic Verification

### Products & Catalog
- [ ] Create product → Shows in product list
- [ ] Update product → Changes visible to all users
- [ ] Delete product → Cannot recreate same SKU (or conflicts)
- [ ] Brand/Category relationships work correctly
- [ ] Product images upload and display correctly

### Customers & Parties
- [ ] Create customer → Shows in customer list
- [ ] Update customer → Changes visible
- [ ] Customer contact info editable
- [ ] Multiple contacts per customer supported

### Sales Workflow
- [ ] Create sale → Stock deduced
- [ ] Sale with multiple items → Each item deducted correctly
- [ ] Sale with invalid customer → Error
- [ ] Sale with out-of-stock product → Error
- [ ] Sale total = sum of line items

### Invoicing
- [ ] Invoice created from sale
- [ ] Invoice immutable after approval
- [ ] Invoice number unique per series per tenant
- [ ] Invoice total = sale total
- [ ] Invoice can be viewed but not edited post-approval

### Cash & Payments
- [ ] Cash movement created for payment
- [ ] Cash movement immutable
- [ ] Multiple cash movements don't conflict
- [ ] Bank reconciliation possible

---

## Compliance & Legal

### Spanish Fiscal Requirements
- [ ] Architecture supports VeriFactu compliance
- [ ] Invoices immutable (required by law)
- [ ] Invoice numbering sequential (required by law)
- [ ] Audit trail exists (required by law)
- [ ] No manual audit log manipulation possible
- [ ] Invoice series defined per business area
- [ ] Tax authority can request audit export

### GDPR (if storing EU customer data)
- [ ] Data retention policy defined
- [ ] User can request data export
- [ ] User can request account deletion
- [ ] Audit logs show data access/deletion
- [ ] Encryption at rest for sensitive data

### PCI DSS (if handling credit cards)
- [ ] No card data stored in system
- [ ] If processing: PCI-DSS level 1 assessed
- [ ] Encryption in transit enforced
- [ ] Card data never logged or exposed in error messages

---

## Documentation

### For Operations
- [ ] Deployment procedure documented
- [ ] Environment variable list with descriptions
- [ ] Database backup procedure documented
- [ ] Restore procedure documented
- [ ] Common troubleshooting guide
- [ ] Monitoring alert setup documented

### For Developers
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture decision records (ADRs)
- [ ] How to run locally documented
- [ ] How to run tests documented
- [ ] Git workflow documented

### For Customers
- [ ] User guide / tutorials
- [ ] FAQ document
- [ ] Support contact information
- [ ] SLA documented (uptime %, response time)

---

## Pre-Launch Testing

### Integration Testing
- [ ] End-to-end: Register → Login → Create Sale → Invoice
- [ ] Multi-tenant: Customer A, B, C see only their data
- [ ] Concurrent operations: 5 simultaneous sales, no conflicts
- [ ] Error scenarios: Invalid input, insufficient permission, resource not found

### Regression Testing
- [ ] Existing feature checklist
- [ ] No regressions from Phase 1-5 refactors

### Security Testing
- [ ] Penetration test completed
- [ ] OWASP Top 10 vulnerabilities checked
- [ ] SQL injection test
- [ ] XSS test
- [ ] CSRF test (should be disabled, why?)
- [ ] Privilege escalation test

### Performance Testing
- [ ] Load test: 100+ concurrent users
- [ ] Stress test: 1000+ concurrent requests
- [ ] Endurance test: 24-hour run, no memory leaks
- [ ] Spike test: Sudden 10x traffic increase handled

---

## Customer Acceptance

- [ ] Customer 1 successfully created and configured
- [ ] Customer 1 can login
- [ ] Customer 1 can perform basic operations (CRUD)
- [ ] Customer 1 can export data (if required)
- [ ] Customer support team trained
- [ ] Customer SLA understood and documented

---

## Final Sign-Off

### Technical Lead
- [ ] Code reviewed
- [ ] Architecture verified
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Monitoring in place

**Sign-off**: _______________  **Date**: _________

### Product Lead
- [ ] Feature complete
- [ ] Business requirements met
- [ ] Documentation complete
- [ ] Customer ready

**Sign-off**: _______________  **Date**: _________

### Operations Lead
- [ ] Deployment procedure tested
- [ ] Monitoring configured
- [ ] Backup procedure tested
- [ ] Rollback procedure tested
- [ ] On-call procedure defined

**Sign-off**: _______________  **Date**: _________

---

## Post-Launch Monitoring (First Week)

- [ ] Error rate < 0.1%
- [ ] Average response time < 500ms
- [ ] Database connection pool healthy
- [ ] No memory leaks (memory stable)
- [ ] No hung requests
- [ ] Audit logs recording correctly
- [ ] No customer complaints about data loss/corruption

---

## Success Criteria

**MVP is production-ready when**:
1. All security checks passing
2. Multi-tenant isolation verified
3. Financial data integrity proven
4. Performance acceptable (< 2s page load)
5. Monitoring in place
6. Documentation complete
7. Customer acceptance test passed
8. No critical bugs remaining

---

**Status**: Ready for Phase Launch
