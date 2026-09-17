

### Task 1.1: Remove Public Endpoint Wildcard

```bash
cd /Users/cristian/Programacion/Proyectos/RetailManager/backend/erphub-api/microservices/retail-api
```

**Edit**: `src/main/java/com/zaphirio/retailapi/auth/security/config/SecurityConfig.java`

Remove line 61: `"/api/v1/**"`

The list should now end with:
```java
        "/api/v1/invitations/accept"
);  // Removed "/api/v1/**"
```

**Verification**:
```bash
# Grep to verify the wildcard is removed
grep -n "/api/v1/\*\*" src/main/java/com/zaphirio/retailapi/auth/security/config/SecurityConfig.java
# Should return: no results
```

---

### Task 1.2: Add Tenant ID to JWT Claims

**File**: `src/main/java/com/zaphirio/retailapi/auth/security/jwt/JwtService.java`

Check current implementation and ensure it extracts/stores:
- `userId`
- `tenantId` (from User → Company → TenantId)
- `roles` (from User → Roles)

Add if missing:
```java
public String generateToken(String userId, String tenantId, List<String> roles) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("tenantId", tenantId);
    claims.put("roles", roles);
    // ... create JWT
}

public String getTenantIdFromJWT(String token) {
    return getClaim(token, claims -> claims.get("tenantId", String.class));
}

public List<String> getRolesFromJWT(String token) {
    return getClaim(token, claims -> claims.get("roles", List.class));
}
```

---

### Task 1.3: Create TenantContext Holder

**File**: `src/main/java/com/zaphirio/retailapi/shared/security/TenantContext.java` (NEW)

```java
package com.zaphirio.retailapi.shared.security;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class TenantContext {
    private static final ThreadLocal<String> tenantIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userIdHolder = new ThreadLocal<>();
    
    public static void setContext(String tenantId, String userId) {
        if (tenantId == null) {
            log.warn("Attempt to set null tenantId");
            throw new IllegalArgumentException("Tenant ID cannot be null");
        }
        tenantIdHolder.set(tenantId);
        userIdHolder.set(userId);
        log.debug("TenantContext set: tenant={}", tenantId);
    }
    
    public static String getTenantId() {
        String tenantId = tenantIdHolder.get();
        if (tenantId == null) {
            throw new IllegalStateException("Tenant ID not set in context");
        }
        return tenantId;
    }
    
    public static String getUserId() {
        String userId = userIdHolder.get();
        if (userId == null) {
            throw new IllegalStateException("User ID not set in context");
        }
        return userId;
    }
    
    public static void clear() {
        tenantIdHolder.remove();
        userIdHolder.remove();
    }
}
```

---

### Task 1.4: Update JwtFilter to Set TenantContext

**File**: `src/main/java/com/zaphirio/retailapi/auth/security/jwt/JwtFilter.java`

Update the `doFilterInternal` method to set tenant context:

```java
@Override
protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain) throws ServletException, IOException {
    
    try {
        String jwt = getJwtFromRequest(request);
        
        if (jwt != null && jwtService.validateToken(jwt)) {
            String userId = jwtService.getUserIdFromJWT(jwt);
            String tenantId = jwtService.getTenantIdFromJWT(jwt);
            
            // ✅ Set tenant context for this request
            TenantContext.setContext(tenantId, userId);
            
            // ... rest of filter logic
        }
    } finally {
        // Clear tenant context after request
        TenantContext.clear();
    }
    
    filterChain.doFilter(request, response);
}
```

---

## Day 2: Add RBAC Annotations to All Controllers

### Task 2.1: Add @PreAuthorize to Controller Methods

Define Roles:
```java
// In a constants file or as enums
public class SecurityRoles {
    public static final String ROLE_ADMIN = "ADMIN";           // Full system access
    public static final String ROLE_SALES = "SALES";           // Create sales, view products
    public static final String ROLE_INVENTORY = "INVENTORY";   // Manage stock only
    public static final String ROLE_FINANCE = "FINANCE";       // View invoices, payments
    public static final String ROLE_VIEWER = "VIEWER";         // Read-only access
}
```

**Pattern for each controller**:
```java
@RestController
@RequestMapping("/api/v1/{resource}")
public class {Resource}Controller {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'VIEWER', 'FINANCE', 'INVENTORY')")
    public List<{Resource}Response> getAll(...) { ... }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'VIEWER', 'FINANCE', 'INVENTORY')")
    public {Resource}Response getById(...) { ... }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public {Resource}Response create(...) { ... }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public {Resource}Response update(...) { ... }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(...) { ... }
}
```

**Apply to all 27 controllers**:

Controllers needing RBAC:
```
auth/controller/AuthController.java
auth/controller/RegistrationController.java
auth/controller/PasswordRecoveryController.java
auth/controller/InvitationsController.java
auth/controller/AdminInvitationController.java

catalog/controller/ProductController.java
catalog/controller/BrandController.java
catalog/controller/CategoryController.java
catalog/controller/PricingController.java
catalog/controller/SupplierCatalogController.java
catalog/controller/ProductCategoryController.java
catalog/controller/ProductSupplierController.java
catalog/controller/InventoryHistoryController.java

inventory/controller/StockController.java
inventory/controller/WarehouseController.java

operation/controller/SaleController.java
operation/controller/PurchaseController.java
operation/controller/InvoiceController.java

party/controller/CustomerController.java
party/controller/SupplierController.java
party/controller/BranchController.java
party/controller/LocationController.java

media/controller/ImageController.java
```

---

## Day 3: Hardening & Validation

### Task 3.1: Update Actuator Exposure

**File**: `src/main/resources/application.yaml`

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    tags:
      application: ${spring.application.name}
```

### Task 3.2: Fix CORS Configuration

**File**: `src/main/java/com/zaphirio/retailapi/auth/security/config/SecurityConfig.java`

Verify CORS uses environment variables (already done):
```java
@Value("${app.security.cors.allowed-origins:http://localhost:3000,http://localhost:4200}")
private String allowedOrigins;
```

**Add to application.yaml**:
```yaml
app:
  security:
    cors:
      allowed-origins: http://localhost:3000,http://localhost:4200,http://localhost:3001
```

---

### Task 3.3: Add Password Strength Validation

**File**: `src/main/java/com/zaphirio/retailapi/shared/validation/PasswordValidator.java` (NEW)

```java
package com.zaphirio.retailapi.shared.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Slf4j
@Component
public class PasswordValidator {
    
    // Min 12 chars, at least 1 upper, 1 lower, 1 digit, 1 special char
    private static final Pattern PASSWORD_PATTERN = 
        Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$");
    
    public boolean isValid(String password) {
        if (password == null || password.length() < 12) {
            log.warn("Password validation failed: length < 12");
            return false;
        }
        
        boolean valid = PASSWORD_PATTERN.matcher(password).matches();
        if (!valid) {
            log.warn("Password validation failed: missing required character types");
        }
        return valid;
    }
    
    public String getRequirements() {
        return "Password must be 12+ characters with uppercase, lowercase, digit, and special character (@$!%*?&)";
    }
}
```

Use in AuthService:
```java
@PostMapping("/register")
public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
    if (!passwordValidator.isValid(request.getPassword())) {
        throw new InvalidPasswordException(passwordValidator.getRequirements());
    }
    // ... continue
}
```

---

### Task 3.4: Update Global Exception Handler

**File**: `src/main/java/com/zaphirio/retailapi/shared/exception/GlobalExceptionHandler.java`

Add handlers:
```java
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(
        AccessDeniedException ex,
        HttpServletRequest request) {
    log.warn("Access denied to {}: {}", request.getRequestURI(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ErrorResponse.builder()
            .message("Access Denied")
            .details("You do not have permission to access this resource")
            .timestamp(LocalDateTime.now())
            .build());
}

@ExceptionHandler(AuthenticationException.class)
public ResponseEntity<ErrorResponse> handleAuthenticationException(
        AuthenticationException ex,
        HttpServletRequest request) {
    log.warn("Authentication failed for {}", request.getRequestURI());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ErrorResponse.builder()
            .message("Authentication Failed")
            .details("Invalid credentials or missing authentication token")
            .timestamp(LocalDateTime.now())
            .build());
}
```

---

### Task 3.5: Add Security Headers

**File**: `src/main/java/com/zaphirio/retailapi/auth/security/config/SecurityConfig.java`

In `securityFilterChain` method, add:
```java
.headers(headers -> headers
    .frameOptions(frameOptions -> frameOptions.deny())
    .xssProtection(xssProtection -> xssProtection.and(true))
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
)
```

---

### Task 3.6: Add File Upload Validation

**File**: `src/main/java/com/zaphirio/retailapi/media/service/ImageServiceImpl.java`

Add validation before upload:
```java
private static final List<String> ALLOWED_TYPES = 
    Arrays.asList("image/jpeg", "image/png", "image/webp");

private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

public String uploadImage(MultipartFile file) {
    // Validate type
    if (!ALLOWED_TYPES.contains(file.getContentType())) {
        throw new InvalidFileTypeException("Only JPEG, PNG, WebP allowed. Got: " + file.getContentType());
    }
    
    // Validate size
    if (file.getSize() > MAX_FILE_SIZE) {
        throw new FileTooLargeException("Max 5MB. Got: " + (file.getSize() / 1024 / 1024) + "MB");
    }
    
    // Sanitize filename
    String sanitized = file.getOriginalFilename()
        .replaceAll("[^a-zA-Z0-9._-]", "_")
        .replaceAll("^_+", "");
    
    // Upload...
}
```

---

## Phase 1 Checklist

- [ ] **Day 1.1**: Remove `/api/v1/**` from PUBLIC_ENDPOINTS
- [ ] **Day 1.2**: Add tenantId to JWT claims in JwtService
- [ ] **Day 1.3**: Create TenantContext.java
- [ ] **Day 1.4**: Update JwtFilter to set TenantContext

- [ ] **Day 2.1**: Add @PreAuthorize to all 27 controllers

- [ ] **Day 3.1**: Update actuator exposure in application.yaml
- [ ] **Day 3.2**: Verify CORS configuration
- [ ] **Day 3.3**: Add PasswordValidator
- [ ] **Day 3.4**: Update GlobalExceptionHandler
- [ ] **Day 3.5**: Add security headers
- [ ] **Day 3.6**: Add file upload validation

---

## Testing Phase 1

### Test 1: Unauthenticated Access (Should Fail)
```bash
curl -v http://localhost:9000/api/v1/products
# Expected: 401 Unauthorized
```

### Test 2: Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:9000/api/v1/auth/registration/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123!",
    "firstName":"John",
    "lastName":"Doe"
  }'

# 2. Login
curl -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'
# Returns: {"token":"eyJhbGc...","refreshToken":"..."}

# 3. Access protected endpoint
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:9000/api/v1/products
# Expected: 200 OK with data
```

### Test 3: Insufficient Role (Should Fail)
```bash
# Register with ROLE_VIEWER only
# Try to create product (requires ROLE_ADMIN or ROLE_SALES)
curl -X POST http://localhost:9000/api/v1/products \
  -H "Authorization: Bearer {viewer_token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","price":100}'
# Expected: 403 Forbidden
```

### Test 4: CORS Validation
```bash
# Request from unauthorized origin
curl -H "Origin: http://evil.com" \
  -H "Authorization: Bearer {token}" \
  http://localhost:9000/api/v1/products
# Expected: CORS error or empty response (no Access-Control-Allow-Origin header)
```

---

## Commit Phase 1

```bash
cd /Users/cristian/Programacion/Proyectos/RetailManager
git add -A
git commit -m "refactor(security): enable jwt enforcement globally

- Remove public wildcard endpoint (/api/v1/**)
- Add @PreAuthorize annotations to all controllers
- Implement TenantContext for multi-tenancy
- Extend JWT claims with tenantId and roles
- Add password strength validation
- Secure actuator endpoints
- Add security headers (HSTS, X-Frame-Options, CSP)
- Improve error handling for auth failures
- Add file upload validation

BREAKING: All endpoints now require authentication.
Clients must provide Bearer token in Authorization header."
```

---

## Status After Phase 1

✅ All endpoints protected with JWT authentication  
✅ RBAC enforced via @PreAuthorize  
✅ TenantContext available for multi-tenancy prep  
✅ Security headers configured  
✅ Password validation enforced  
✅ File uploads validated  
✅ Comprehensive error responses  

---

**Next**: Phase 2 (Remove Microservice Artifacts)
