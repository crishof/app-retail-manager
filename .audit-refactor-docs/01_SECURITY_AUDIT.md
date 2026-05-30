# Security Audit Report – ERPHub SaaS ERP

**Status**: 🔴 CRITICAL – Multiple unresolved vulnerabilities  
**CVSS Score**: 9.8 (Critical)  
**Affected**: All 27 controllers, financial operations, multi-tenant data  

---

## Vulnerability Catalog

### Critical (CVSS 9.0-10.0)

#### 1. Authentication Bypass – All Endpoints
**Location**: `auth/security/config/SecurityConfig.java:61`  
**Severity**: 🔴 CRITICAL (CVSS 9.8)  
**Impact**: Any unauthenticated client can access ALL data

**Current Code**:
```java
@EnableWebSecurity
@EnableMethodSecurity
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                .requestMatchers("/api/v1/**").permitAll()  // ❌ CRITICAL: ALL ENDPOINTS PUBLIC
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
```

**Risk**: Attacker can:
- Read all products, customers, suppliers
- Create/modify/delete sales, purchases, invoices
- Access customer payment data
- Manipulate inventory

**Exploitation Example**:
```bash
# No authentication needed!
curl http://localhost:8080/api/v1/products
curl http://localhost:8080/api/v1/sales -X POST -d '...'
```

**Fix**: Phase 1, Day 1

---

#### 2. No Multi-Tenant Data Isolation
**Location**: All repositories  
**Severity**: 🔴 CRITICAL (CVSS 9.5)  
**Impact**: Tenant A can read/modify Tenant B's data

**Current Code**:
```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAll();  // ❌ Returns ALL products, all tenants!
    Product findById(Long id);  // ❌ No tenant check
}

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.findAll();  // ❌ No tenant filtering
    }
}
```

**Risk Scenario**:
- Company A (tenant=123) logs in
- Company A can see Company B's (tenant=456) entire product catalog
- Company A can delete Company B's inventory
- Company A can see Company B's sales/revenue

**Current Architecture**: Single database, NO tenant isolation mechanism

**Fix**: Phase 3 (Days 7-10)

---

#### 3. Mutable Financial Entities (Violates Spanish Law)
**Location**: `operation/model/Invoice.java`, `operation/model/CashMovement.java`  
**Severity**: 🔴 CRITICAL (CVSS 8.5)  
**Impact**: Auditor rejection, fiscal authority penalties

**Current Code**:
```java
@Entity
@Table(name = "invoice")
public class Invoice {
    @Id
    private Long id;
    
    private String invoiceNumber;
    private LocalDateTime createdAt;
    private String description;  // Can be edited!
    private BigDecimal totalAmount;  // Can be edited!
    
    // Full setter methods allow modification
    public void setDescription(String desc) { this.description = desc; }
    public void setTotalAmount(BigDecimal amount) { this.totalAmount = amount; }
}
```

**Current Usage**:
```java
@PutMapping("/{id}")
public InvoiceResponse updateInvoice(@PathVariable Long id, @RequestBody InvoiceRequest req) {
    Invoice inv = invoiceRepo.findById(id).orElseThrow();
    inv.setDescription(req.getDescription());  // ❌ Editing invoice after creation!
    inv.setTotalAmount(req.getTotalAmount());
    return invoiceRepo.save(inv);
}
```

**Spanish Fiscal Law Requirements**:
- Invoice CANNOT be edited after creation
- Each invoice must have unique, immutable number
- Invoice chain: invoice(n) must reference hash(invoice(n-1))
- VeriFactu: Proof of immutability

**Risk**: Tax authority will REJECT the system

**Fix**: Phase 4 (Days 11-14)

---

#### 4. Race Condition – Stock Management (Inventory Loss)
**Location**: `inventory/model/Stock.java:37-45`  
**Severity**: 🔴 CRITICAL (CVSS 8.8)  
**Impact**: Lost inventory, duplicate sales

**Current Code**:
```java
@Entity
@Table(name = "stock")
public class Stock {
    @Id
    private Long id;
    
    private Long productId;
    @Column(nullable = false)
    private Long quantity;  // ❌ No @Version, no locking!
    
    public void deductQuantity(Long amount) {
        this.quantity -= amount;  // ❌ NOT THREAD-SAFE
    }
}
```

**Current Usage**:
```java
@Transactional
public void deductStock(Long productId, Long quantity) {
    Stock stock = stockRepo.findByProductId(productId);  // No pessimistic lock
    if (stock.getQuantity() < quantity) throw new InsufficientStock();
    stock.deductQuantity(quantity);  // Race condition window here!
    stockRepo.save(stock);
}
```

**Race Condition Scenario**:
```
Thread 1 (Sale A): Select stock where quantity = 100
Thread 2 (Sale B): Select stock where quantity = 100  [same value]
Thread 1: quantity -= 60 → 40
Thread 2: quantity -= 60 → 40  [BOTH see 100, both deduct!]
Result: Actual stock = 40 (should be -20, but stored as -20 with no tracking)
```

**Business Impact**:
- Oversold products
- Negative stock records
- Duplicate fulfillment
- Lost revenue

**Fix**: Phase 4 (Days 11-14) – Pessimistic locking + SERIALIZABLE isolation

---

#### 5. Exposed Actuator Endpoints
**Location**: `application.yaml`, SecurityConfig  
**Severity**: 🔴 CRITICAL (CVSS 8.2)  
**Impact**: Information disclosure, system manipulation

**Current Endpoints Available**:
```
GET  /actuator/health          → DB status, internal IPs
GET  /actuator/metrics         → System performance, business metrics
GET  /actuator/env             → Environment variables (secrets!)
GET  /actuator/configprops     → Spring configuration (credentials!)
POST /actuator/shutdown        → Kill application
```

**Example Exploits**:
```bash
# Dump all environment variables (includes DB password!)
curl http://localhost:8080/actuator/env

# Check metrics (see business data)
curl http://localhost:8080/actuator/metrics

# Kill the app
curl -X POST http://localhost:8080/actuator/shutdown
```

**Fix**: Phase 1, Day 2 – Restrict actuator exposure

---

### High (CVSS 7.0-8.9)

#### 6. Missing RBAC Authorization
**Location**: All 27 controllers  
**Severity**: 🟠 HIGH (CVSS 7.5)  
**Impact**: Any authenticated user has full access

**Current Code**:
```java
@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {
    @PostMapping
    public SaleResponse createSale(@RequestBody SaleRequest req) {
        // ❌ No @PreAuthorize
        // ❌ Any authenticated user can create sales
        // ❌ No role-based checks
        return saleService.create(req);
    }
    
    @DeleteMapping("/{id}")
    public void deleteSale(@PathVariable Long id) {
        // ❌ No check for ROLE_ADMIN or ownership
        saleService.delete(id);
    }
}
```

**Missing Roles/Permissions**:
- `ROLE_ADMIN` – Full system access
- `ROLE_SALES` – Can create sales, view customers
- `ROLE_INVENTORY` – Can manage stock only
- `ROLE_FINANCE` – Can access invoices, payments
- `ROLE_VIEWER` – Read-only access

**Fix**: Phase 1, Days 2-3

---

#### 7. No Audit Logging
**Location**: Missing entirely  
**Severity**: 🟠 HIGH (CVSS 7.8)  
**Impact**: No compliance proof, cannot investigate issues

**Missing Audit Trail for**:
- Who created/modified/deleted invoices?
- Who changed stock quantities?
- Who accessed customer data?
- What IP/session performed the action?
- When exactly did sensitive operations occur?

**Risk**: Fiscal auditor cannot verify system security

**Fix**: Phase 4 (Days 11-14)

---

#### 8. Unencrypted Communication (HTTP)
**Location**: `docker/compose/docker-compose.yml`  
**Severity**: 🟠 HIGH (CVSS 7.9)  
**Impact**: JWT tokens, credentials, customer data in plaintext

**Current Setup**:
```yaml
api-gateway:
  ports:
    - "8080:8080"  # ❌ HTTP only, no HTTPS
```

**Risk**: Man-in-the-Middle attack can steal:
- JWT tokens
- Database credentials
- Customer payment data
- Supplier contracts

**Fix**: Phase 5 (deployment with reverse proxy/TLS)

---

#### 9. CORS Configuration Missing/Insecure
**Location**: `auth/security/config/SecurityConfig.java`  
**Severity**: 🟠 HIGH (CVSS 7.2)  
**Impact**: Cross-site requests from any origin

**Current Code**:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList("*"));  // ❌ All origins allowed!
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    config.setAllowCredentials(true);  // ❌ Credentials from any origin!
    return ...;
}
```

**Risk**: Malicious website can:
- Make authenticated requests from user's browser
- Steal JWT tokens
- Create transactions on behalf of user

**Fix**: Phase 1, Day 2 – Whitelist specific origins only

---

### Medium (CVSS 4.0-6.9)

#### 10. No Password Complexity Requirements
**Location**: `auth/service/UserService.java`  
**Severity**: 🟡 MEDIUM (CVSS 5.2)  
**Impact**: Weak passwords = account takeover

**Missing**:
- Minimum 12 characters
- Must include upper, lower, number, symbol
- Password history (can't reuse)
- Password expiration policy

**Fix**: Phase 1, Day 3

---

#### 11. JWT Without Expiration Validation
**Location**: `auth/jwt/JwtTokenProvider.java`  
**Severity**: 🟡 MEDIUM (CVSS 5.5)  
**Impact**: Stolen token = permanent access

**Missing**:
- Token expiration time (should be 15-30 min)
- Refresh token mechanism
- Token revocation on logout

**Fix**: Phase 1, Day 3

---

#### 12. SQL Injection Risks (NativeQuery Usage)
**Location**: Multiple repositories  
**Severity**: 🟡 MEDIUM (CVSS 6.5)  
**Impact**: Database compromise, data theft/modification

**Example**:
```java
@Query(value = "SELECT * FROM products WHERE category = ?1", nativeQuery = true)
List<Product> findByCategory(String category);  // Parameterized, but risky
```

**Fix**: Use `@Query` with JPQL only, review all `nativeQuery=true`

---

#### 13. Insecure File Upload (Media Service)
**Location**: `media/service/ImageServiceImpl.java`  
**Severity**: 🟡 MEDIUM (CVSS 6.2)  
**Impact**: Malware upload, DoS attack

**Missing**:
- File type validation
- File size limits
- Virus scanning
- Filename sanitization

**Fix**: Phase 1, Day 3

---

---

## Vulnerability Summary Table

| # | Vulnerability | CVSS | Severity | Phase | Days |
|---|---|---|---|---|---|
| 1 | Authentication Bypass | 9.8 | 🔴 CRITICAL | 1 | 1-3 |
| 2 | No Multi-Tenant Isolation | 9.5 | 🔴 CRITICAL | 3 | 7-10 |
| 3 | Mutable Financial Entities | 8.5 | 🔴 CRITICAL | 4 | 11-14 |
| 4 | Stock Race Condition | 8.8 | 🔴 CRITICAL | 4 | 11-14 |
| 5 | Exposed Actuator | 8.2 | 🔴 CRITICAL | 1 | 1-3 |
| 6 | Missing RBAC | 7.5 | 🟠 HIGH | 1 | 1-3 |
| 7 | No Audit Logging | 7.8 | 🟠 HIGH | 4 | 11-14 |
| 8 | Unencrypted HTTP | 7.9 | 🟠 HIGH | 5 | 15+ |
| 9 | Insecure CORS | 7.2 | 🟠 HIGH | 1 | 1-3 |
| 10 | Weak Password Policy | 5.2 | 🟡 MEDIUM | 1 | 1-3 |
| 11 | No JWT Expiration | 5.5 | 🟡 MEDIUM | 1 | 1-3 |
| 12 | SQL Injection Risk | 6.5 | 🟡 MEDIUM | 1 | 1-3 |
| 13 | Insecure File Upload | 6.2 | 🟡 MEDIUM | 1 | 1-3 |

---

## Compliance Impact

### Spanish Fiscal Requirements
- ❌ VeriFactu: Mutable invoices violate spec
- ❌ No audit trail for fiscal events
- ❌ Cannot prove invoice integrity
- ❌ TAX AUTHORITY WILL REJECT

### GDPR (EU Data Protection)
- ❌ No audit trail for data access
- ❌ No ability to prove data deletion
- ❌ No encrypted data in transit

### PCI-DSS (Payment Card Industry)
- ❌ If handling card data: MAJOR FAILURES
- ❌ Unencrypted transmission
- ❌ No access control
- ❌ No audit logging

---

## Remediation Timeline

### Phase 1: Security Hardening (Days 1-3)
- Enable JWT globally
- Add RBAC annotations
- Secure actuator
- Fix CORS
- Password complexity
- JWT expiration
- File upload validation
- **Status**: ✅ Ready to execute

### Phase 2: Remove Microservice Artifacts (Days 4-6)
- (No direct security improvement, but reduces attack surface)

### Phase 3: Multi-Tenancy (Days 7-10)
- Enable data isolation
- Reduce insider threat

### Phase 4: Fiscal Compliance (Days 11-14)
- Immutable invoices
- Audit logging
- Stock transactional integrity

### Phase 5: Production (Days 15+)
- TLS/HTTPS
- Secret management

---

## Security Checklist – Before MVP Launch

- [ ] All endpoints require JWT authentication
- [ ] RBAC properly configured for 5+ roles
- [ ] Multi-tenant data isolation tested + verified
- [ ] Invoice immutability enforced
- [ ] Comprehensive audit logs for financial operations
- [ ] Stock movements use SERIALIZABLE isolation
- [ ] Actuator endpoints restricted
- [ ] CORS whitelist configured (no *)
- [ ] Password complexity enforced
- [ ] JWT has 15-30 min expiration
- [ ] No native SQL queries without parameterization
- [ ] File uploads validated (type, size, content)
- [ ] Error messages don't expose internals
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] Penetration test completed
- [ ] Fiscal auditor approval obtained

---

**Next**: Move to Phase 1 execution
