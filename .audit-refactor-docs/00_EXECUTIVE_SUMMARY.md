# ERPHub – Full Technical Audit & Refactor Roadmap
## Executive Summary – Production Readiness Assessment

**Date**: May 28, 2026  
**Project**: ERPHub SaaS ERP Platform  
**Status**: 🔴 CRITICAL – Not production ready  
**Team Capacity**: Aggressive 5-week refactor timeline  
**Target Deployment**: Hetzner VPS, Docker Compose  

---

## Current State Diagnosis

### Architecture Maturity

| Dimension | Current | Target | Gap |
|-----------|---------|--------|-----|
| **Monolith Design** | Transitioned via copy-paste | Modular + Spring Modulith | CRITICAL |
| **Distributed Artifacts** | 11 Feign clients, RabbitMQ events | 0 Feign clients, disabled events | CRITICAL |
| **Security** | Endpoints public, auth disabled | JWT + RBAC enforced | CRITICAL |
| **Multi-Tenancy** | None | Schema-per-tenant isolation | CRITICAL |
| **Data Integrity** | Race conditions, mutable financials | Transactional, immutable fiscal docs | CRITICAL |
| **Production Basics** | Missing | Flyway, logging, monitoring | HIGH |
| **Fiscal Compliance** | Not ready | VeriFactu-ready foundation | HIGH |

### Technology Stack Assessment

✅ **CORRECT**:
- Java 25
- Spring Boot 4.0.6
- PostgreSQL 17-alpine
- RabbitMQ 3.13

❌ **OVER-ENGINEERED**:
- Spring Cloud Config Server (MVP doesn't need it)
- Spring Cloud Eureka/Service Registry (MVP doesn't need it)
- Spring Cloud Gateway (bypass for direct connections)
- OpenFeign internal clients (Feign for external APIs only)

❌ **MISSING**:
- Flyway database migrations
- Multi-tenant context/isolation
- Structured logging
- Audit logging framework
- Health checks beyond actuator
- Rate limiting

---

## Critical Risks Assessment

### 🔴 CRITICAL – Block Production (Must Fix Before Selling)

| Risk | Impact | Probability | Fix Time |
|------|--------|-------------|----------|
| **Unprotected Endpoints** | Any client can access data | 100% | 1 day |
| **No Multi-Tenancy** | Data leakage between customers | 100% | 4 days |
| **Race Conditions (Stock)** | Financial data loss | HIGH | 2 days |
| **Mutable Invoices** | Spanish tax authority rejection | 100% | 3 days |
| **No Audit Trail** | Compliance violation | HIGH | 2 days |
| **Circular Dependencies** | Hard to maintain/scale | HIGH | 3 days |

### 🟠 HIGH – Operational Issues

| Risk | Impact | Probability | Fix Time |
|------|--------|-------------|----------|
| **No Database Migrations** | Deployment failures | HIGH | 2 days |
| **Unnecessary Feign Clients** | Performance + complexity | 100% | 3 days |
| **Event Sync Async Patterns** | Stale data, debugging nightmare | HIGH | 1 day |
| **No Health Checks** | Can't monitor in production | HIGH | 1 day |

---

## Business Impact

### Current Blockers for MVP

**CANNOT SELL UNTIL:**
1. ✅ Authentication enforced on all endpoints
2. ✅ Multi-tenant data isolation proven
3. ✅ Invoices immutable + audit trail
4. ✅ Stock movements atomic (no race conditions)
5. ✅ Database migrations working
6. ✅ Production monitoring enabled

**Estimated Customer Risk**: 🔴 **CRITICAL**
- Customer A could access Customer B's data
- Financial data could be lost in concurrent operations
- Invoices could be edited (violates Spanish law)
- No audit trail = no compliance proof

---

## Project Structure (Current)

```
retailapi/ (311 Java files)
├── auth/           (30 files) – Security partially implemented, NOT ENFORCED
├── catalog/        (85 files) – 11 Feign clients, heavy duplication
├── inventory/      (25 files) – Race conditions, no locking
├── operation/      (45 files) – Mutable invoices, cash movements
├── party/          (35 files) – No tenant isolation
├── media/          (10 files) – Cloudinary integration
└── shared/         (81 files) – 11 Feign clients, 5 configs, events

Spring Cloud Infrastructure (not needed for MVP):
├── api-gateway/    – Bypass or disable
├── config-server/  – Use local properties
└── service-registry/ – Not needed for monolith
```

---

## Recommended Target Architecture

### Spring Modulith with DDD Boundaries

```
retailapi/
├── shared/                      (infrastructure concerns)
│   ├── exception/               – Global exception handling
│   ├── validation/              – Cross-domain validators
│   ├── security/                – JWT, RBAC, TenantContext
│   ├── audit/                   – Audit logging infrastructure
│   ├── persistence/             – Custom repositories, Flyway
│   └── config/                  – Spring configurations
│
├── tenant/                      (cross-cutting multi-tenancy)
│   ├── domain/                  – Tenant entity
│   ├── service/                 – TenantService
│   └── security/                – TenantFilter, TenantContext
│
├── catalog/                     (@ApplicationModule boundary)
│   ├── domain/                  – Product, Brand, Category entities
│   ├── application/             – ProductService, BrandService
│   ├── infrastructure/          – ProductRepository, Mappers
│   └── presentation/            – ProductController, DTOs
│
├── inventory/                   (@ApplicationModule boundary)
│   ├── domain/                  – Stock, StockMovement entities
│   ├── application/             – StockService, MovementService
│   ├── infrastructure/          – StockRepository
│   └── presentation/            – InventoryController
│
├── operation/                   (@ApplicationModule boundary)
│   ├── domain/                  – Invoice, Sale, Purchase, Cash
│   ├── application/             – InvoiceService, SaleService, CashService
│   ├── infrastructure/          – Repositories, AuditLog
│   └── presentation/            – Controllers
│
└── party/                       (@ApplicationModule boundary)
    ├── domain/                  – Customer, Supplier, Branch entities
    ├── application/             – CustomerService, SupplierService
    ├── infrastructure/          – Repositories
    └── presentation/            – Controllers
```

---

## Refactor Strategy – 5 Phases, 5 Weeks (Aggressive Timeline)

### Phase 1: Security Hardening & Global Auth (Days 1-3)
- Enable JWT enforcement on ALL endpoints
- Add RBAC via `@PreAuthorize` annotations
- Create TenantContext from JWT claims
- Disable/secure actuator endpoints
- Expected Impact: **Endpoints now protected**

### Phase 2: Remove Microservice Artifacts (Days 4-6)
- Remove 11 Feign clients
- Convert to direct service calls
- Remove unnecessary Spring Cloud dependencies
- Disable RabbitMQ event sync
- Expected Impact: **Simpler, faster, more reliable**

### Phase 3: Implement Multi-Tenancy (Days 7-10)
- Add schema-per-tenant isolation
- Create TenantFilter for request context
- Update all repositories with tenant filtering
- Create Flyway multi-tenant migrations
- Expected Impact: **Data isolated per customer**

### Phase 4: Fiscal Compliance & Immutability (Days 11-14)
- Make Invoice immutable after approval
- Add invoice chaining/hashing
- Make CashMovement immutable
- Implement comprehensive audit logging
- Add transactional boundaries
- Expected Impact: **VeriFactu-ready foundation**

### Phase 5: Production Hardening (Days 15-21)
- Flyway database migrations
- Structured logging (JSON format)
- Spring Boot health checks
- Actuator security
- Docker optimization
- Environment separation
- Expected Impact: **Ready for production deployment**

---

## What Gets Fixed

### Security
- ❌ Public endpoints → ✅ Protected with JWT + RBAC
- ❌ No tenant isolation → ✅ Schema-per-tenant enforced
- ❌ Exposed actuator → ✅ Secured/hidden
- ❌ No audit trail → ✅ Comprehensive audit logging

### Architecture
- ❌ 11 Feign clients → ✅ 0 Feign clients (direct calls)
- ❌ RabbitMQ sync → ✅ Disabled for MVP
- ❌ Copy-paste duplication → ✅ Clean DDD boundaries
- ❌ No Spring Modulith → ✅ Explicit @ApplicationModule

### Data Integrity
- ❌ Race conditions (stock) → ✅ Pessimistic locking
- ❌ Mutable invoices → ✅ Immutable after approval
- ❌ Non-transactional → ✅ Proper @Transactional boundaries

### Production
- ❌ No migrations → ✅ Flyway versioning
- ❌ No logging → ✅ Structured JSON logs
- ❌ No monitoring → ✅ Health checks + metrics
- ❌ No audit → ✅ Full audit trail

---

## Dependencies & Risks

### Execution Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking existing clients | MEDIUM | API versioning, deprecation headers |
| Multi-tenant isolation bugs | CRITICAL | Pentest, security review, staging tests |
| Performance regression | MEDIUM | Load testing after Phase 2 & 3 |
| Flyway migration complexity | MEDIUM | Test migrations in staging first |
| Spring Modulith learning curve | LOW | Documentation included |

### Prerequisites
- ✅ Team understanding of DDD/Domain-Driven Design
- ✅ Commitment to 5-week aggressive timeline
- ✅ Access to staging environment for testing
- ✅ Rollback plan for each phase

---

## Success Criteria – Before Production Launch

- ✅ All endpoints require JWT authentication
- ✅ Multi-tenant data isolation proven via automated tests
- ✅ Invoices immutable, audit trail complete
- ✅ Stock movements atomic (SERIALIZABLE transactions)
- ✅ No Feign clients for internal calls
- ✅ Health check endpoints working
- ✅ Structured logging in all services
- ✅ Database migrations versioned via Flyway
- ✅ Documentation complete for operations team

---

## Next Steps

1. **Review & Approve** this assessment
2. **Study Detailed Documents**:
   - `01_SECURITY_AUDIT.md` – Vulnerability catalog
   - `02_ARCHITECTURE_ROADMAP.md` – Week-by-week plan
   - `03_PHASE1_SECURITY_HARDENING.md` – Immediate actions
   - `04_PRODUCTION_MVP_CHECKLIST.md` – Launch requirements
   - `05_FISCAL_COMPLIANCE_STRATEGY.md` – VeriFactu prep

3. **Begin Phase 1** (Security Hardening)

---

## Key Contacts & Escalation

**Architecture Issues**: Review Phase 2 in roadmap
**Security Issues**: Review Phase 1 immediately
**Fiscal Compliance**: Review Phase 4 for VeriFactu strategy
**Production Readiness**: Review Phase 5 checklist

---

**Status**: Ready for Phase 1 execution
**Next Review**: After Phase 1 completion (Day 3)
