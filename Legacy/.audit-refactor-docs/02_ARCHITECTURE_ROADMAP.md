# Architecture Roadmap – 5 Phase Refactor Plan
## Spring Modulith + DDD for Production MVP

**Timeline**: 5 weeks (Aggressive)  
**Team Capacity**: Full-time refactor team  
**Branch**: `refactor/production-hardening`  

---

## Phase 1: Security Hardening & Global Authentication
**Timeline**: Days 1-3 (3 days)  
**Owner**: Security Lead  
**Goal**: Enable JWT enforcement on ALL endpoints, add RBAC

### Deliverables

#### 1.1 Extend SecurityConfig – Global Authentication

**File**: `auth/security/config/SecurityConfig.java`

**Changes**:
```java
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Only public endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/auth/login", "/auth/register").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Strength 12
    }
}
```

#### 1.2 Create JWT Filter

**File**: `auth/security/filter/JwtAuthenticationFilter.java` (NEW)

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = extractJwtFromRequest(request);
            
            if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
                String userId = jwtTokenProvider.getUserIdFromJWT(jwt);
                String tenantId = jwtTokenProvider.getTenantIdFromJWT(jwt);
                List<String> roles = jwtTokenProvider.getRolesFromJWT(jwt);
                
                // Set security context
                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    userId, "", 
                    roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList())
                );
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                    );
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Store tenant ID for later access
                TenantContext.setCurrentTenant(tenantId);
            }
            
        } catch (Exception ex) {
            logger.error("Cannot set user authentication", ex);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

#### 1.3 Enhance JwtTokenProvider

**File**: `auth/jwt/JwtTokenProvider.java`

**Add to existing**:
```java
// Add fields
private static final long JWT_EXPIRATION = 900000;  // 15 minutes
private static final long REFRESH_TOKEN_EXPIRATION = 604800000;  // 7 days

// New methods
public String getTenantIdFromJWT(String token) {
    Claims claims = getAllClaimsFromToken(token);
    return claims.get("tenantId", String.class);
}

public List<String> getRolesFromJWT(String token) {
    Claims claims = getAllClaimsFromToken(token);
    return claims.get("roles", List.class);
}

public boolean validateToken(String token) {
    try {
        Jwts.parserBuilder()
            .setSigningKey(key())
            .build()
            .parseClaimsJws(token);
        
        // Check expiration
        Claims claims = getAllClaimsFromToken(token);
        return claims.getExpiration().after(new Date());
    } catch (MalformedJwtException ex) {
        logger.error("Invalid JWT token");
    } catch (ExpiredJwtException ex) {
        logger.error("Expired JWT token");
    } catch (UnsupportedJwtException ex) {
        logger.error("Unsupported JWT token");
    } catch (IllegalArgumentException ex) {
        logger.error("JWT claims string is empty");
    }
    return false;
}
```

#### 1.4 Create TenantContext

**File**: `shared/security/TenantContext.java` (NEW)

```java
public class TenantContext {
    private static final ThreadLocal<String> tenantIdHolder = new ThreadLocal<>();
    
    public static void setCurrentTenant(String tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID cannot be null");
        }
        tenantIdHolder.set(tenantId);
    }
    
    public static String getCurrentTenant() {
        String tenantId = tenantIdHolder.get();
        if (tenantId == null) {
            throw new IllegalStateException("Tenant ID not set in context");
        }
        return tenantId;
    }
    
    public static void clear() {
        tenantIdHolder.remove();
    }
}
```

#### 1.5 Add RBAC to Controllers

**File**: `catalog/controller/ProductController.java` (EXAMPLE)

```java
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'VIEWER')")
    public List<ProductResponse> getAllProducts(...) { ... }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse createProduct(...) { ... }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse updateProduct(...) { ... }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(...) { ... }
}
```

Apply to all 27 controllers:
- `auth/*Controller`
- `catalog/*Controller`
- `inventory/*Controller`
- `operation/*Controller`
- `party/*Controller`
- `media/*Controller`

#### 1.6 Secure Actuator

**File**: `application.yaml`

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
```

#### 1.7 Fix CORS

**File**: `auth/security/config/SecurityConfig.java` (update)

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    
    // Whitelist specific origins only
    config.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",      // Local dev
        "https://yourdomain.com",      // Production
        "https://admin.yourdomain.com" // Admin portal
    ));
    
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(false);  // Changed to false, origins already specific
    config.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

#### 1.8 Password Complexity Policy

**File**: `auth/service/UserService.java` (NEW method)

```java
@Component
public class PasswordValidator {
    
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$";
    
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);
    
    public boolean isValid(String password) {
        if (password == null || password.length() < 12) {
            throw new InvalidPasswordException("Password must be at least 12 characters");
        }
        
        if (!pattern.matcher(password).matches()) {
            throw new InvalidPasswordException(
                "Password must contain uppercase, lowercase, number, and special character"
            );
        }
        
        return true;
    }
}

// Use in registration:
@PostMapping("/register")
public UserResponse register(@RequestBody RegisterRequest req) {
    passwordValidator.isValid(req.getPassword());
    // ... continue
}
```

#### 1.9 File Upload Validation

**File**: `media/service/ImageServiceImpl.java` (update)

```java
@Service
public class ImageServiceImpl implements ImageService {
    
    private static final List<String> ALLOWED_TYPES = 
        Arrays.asList("image/jpeg", "image/png", "image/webp");
    
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB
    
    @Override
    public String uploadImage(MultipartFile file) {
        // Validate file type
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new InvalidFileTypeException("Only JPEG, PNG, WebP allowed");
        }
        
        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileTooLargeException("Maximum file size is 5MB");
        }
        
        // Sanitize filename
        String sanitizedFilename = sanitizeFilename(file.getOriginalFilename());
        
        // Upload to Cloudinary
        return uploadToCloudinary(file, sanitizedFilename);
    }
    
    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
```

#### 1.10 Global Exception Handler Update

**File**: `shared/exception/GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("Access denied", "User lacks required role", null));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("Authentication failed", "Invalid credentials", null));
    }
    
    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPassword(
            InvalidPasswordException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Invalid password", ex.getMessage(), null));
    }
}
```

### Testing Phase 1

```bash
# Test without auth → Should fail
curl http://localhost:8080/api/v1/products
# Expected: 401 Unauthorized

# Login to get token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"SecurePass123!"}'
# Returns: {"token":"eyJhbGc..."}

# Test with auth → Should succeed
curl http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer eyJhbGc..."
# Expected: 200 OK with data

# Test with insufficient role → Should fail
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer {viewer_token_with_VIEWER_role_only}" \
  -d '{...}'
# Expected: 403 Forbidden
```

### Dependencies for Phase 2

✅ Required before Phase 2:
- SecurityConfig fully enforced
- JWT validation working
- TenantContext available
- RBAC annotations on controllers

---

## Phase 2: Remove Microservice Artifacts
**Timeline**: Days 4-6 (3 days)  
**Owner**: Architecture Lead  
**Goal**: Eliminate Feign clients, simplify runtime complexity

### Deliverables

#### 2.1 Identify All Feign Clients

**Search Results**:
```
shared/client/BrandClient.java          (used by ProductService)
shared/client/CategoryClient.java       (used by ProductService)
shared/client/InventoryClient.java      (used by SaleService)
shared/client/PricingClient.java        (used by SaleService)
shared/client/ProductAPIClient.java     (used internally)
shared/client/ProductPriceLinkClient.java (used by PricingService)
shared/client/OrderClient.java
shared/client/InvoiceClient.java
shared/client/ExchangeRateClient.java
shared/client/SupplierClient.java       (used by SupplierCatalogService)
shared/client/SupplierClient.java       (duplicate)
```

#### 2.2 Convert BrandClient → Direct Service Call

**Before**:
```java
@FeignClient(name = "brand-service", url = "http://localhost:9001")
public interface BrandClient {
    @GetMapping("/api/brands/{id}")
    BrandResponse findById(@PathVariable Long id);
}

// Usage in ProductService
@Service
public class ProductService {
    @Autowired private BrandClient brandClient;
    
    public ProductResponse findProduct(Long id) {
        Product product = productRepo.findById(id).orElseThrow();
        // HTTP call to another service (unnecessary!)
        BrandResponse brand = brandClient.findById(product.getBrandId());
        return mapToResponse(product, brand);
    }
}
```

**After**:
```java
// Remove @FeignClient interface entirely

// Usage in ProductService
@Service
public class ProductService {
    @Autowired private BrandService brandService;  // Direct local call
    
    public ProductResponse findProduct(Long id) {
        Product product = productRepo.findById(id).orElseThrow();
        // Direct method call (local, same process, no HTTP overhead)
        Brand brand = brandService.findById(product.getBrandId());
        return mapToResponse(product, brand);
    }
}
```

**Task**: Apply to all 11 Feign clients

**Files to Delete**:
```
shared/client/BrandClient.java
shared/client/CategoryClient.java
shared/client/InventoryClient.java
shared/client/PricingClient.java
shared/client/ProductAPIClient.java
shared/client/ProductPriceLinkClient.java
shared/client/OrderClient.java
shared/client/InvoiceClient.java
shared/client/ExchangeRateClient.java
shared/client/SupplierClient.java
```

**Services to Update** (add @Autowired for direct calls):
```
ProductService         (remove brandClient, add brandService)
ProductService         (remove categoryClient, add categoryService)
SaleService           (remove inventoryClient, add stockService)
SaleService           (remove pricingClient, add pricingService)
PricingService        (remove productPriceLinkClient, update logic)
SupplierCatalogService (remove supplierClient, add supplierService)
```

#### 2.3 Remove Spring Cloud Feign Dependency

**File**: `pom.xml`

```xml
<!-- REMOVE this dependency -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>

<!-- REMOVE resilience4j circuit breaker if only used for Feign -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

#### 2.4 Disable RabbitMQ Event Sync (for MVP)

**File**: `shared/config/RabbitMQConfig.java`

```java
@Configuration
@ConditionalOnProperty(name = "rabbitmq.event-sync.enabled", havingValue = "true")
public class RabbitMQConfig {
    // Keep as is for future evolution
    // But disable in application.yaml for MVP
}
```

**File**: `application.yaml`

```yaml
rabbitmq:
  event-sync:
    enabled: false  # Disable event sync for MVP
```

**Remove/Disable**:
```
catalog/event/BrandUpdatedEvent.java      (or keep but don't publish)
catalog/event/BrandEventPublisher.java    (@ConditionalOnProperty check)
catalog/event/BrandEventConsumer.java     (@ConditionalOnProperty check)
```

#### 2.5 Replace Product Snapshot Pattern

**Before** (snapshot pattern):
```java
@Entity
public class Product {
    private Long brandId;
    private String brandName;  // ❌ Snapshot, duplicated from Brand
    
    private Long categoryId;
    private String categoryName;  // ❌ Snapshot
}
```

**After** (proper relationships):
```java
@Entity
public class Product {
    @Id
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;  // ✅ Proper FK relationship
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;  // ✅ Proper FK relationship
    
    // Remove snapshot fields
    // No brandName, categoryName fields
}
```

**Migration SQL**:
```sql
-- Remove snapshot columns
ALTER TABLE product DROP COLUMN IF EXISTS brand_name;
ALTER TABLE product DROP COLUMN IF EXISTS category_name;

-- Ensure FK integrity
ALTER TABLE product ADD CONSTRAINT fk_product_brand 
    FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE RESTRICT;
```

#### 2.6 Remove Spring Cloud Config Server Dependency

**File**: `pom.xml`

```xml
<!-- REMOVE -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

**File**: `application.yaml`

```yaml
# REMOVE this entire section:
# spring:
#   config:
#     import: "optional:configserver:http://localhost:8088"

# Replace with local properties
spring:
  application:
    name: retail-api
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:erphub}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:password}
  jpa:
    hibernate:
      ddl-auto: validate
```

#### 2.7 Update Docker Compose

**File**: `docker/compose/docker-compose.yml`

```yaml
# REMOVE or disable these services:
# - config-server
# - service-registry (Eureka)
# - api-gateway (if not needed)

# Keep only:
services:
  postgres:
    # unchanged

  rabbitmq:
    # unchanged, but can be optional for MVP

  # Optionally keep api-gateway for reverse proxy
  api-gateway:
    # Keep if using for TLS/reverse proxy
```

#### 2.8 Update Environment Properties

**Create**: `application-dev.yaml`

```yaml
spring:
  profiles: dev
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    org.springframework.web: DEBUG
    com.zaphirio.retailapi: DEBUG

server:
  port: 9000
```

**Create**: `application-prod.yaml`

```yaml
spring:
  profiles: prod
  jpa:
    show-sql: false
    properties:
      hibernate:
        jdbc:
          batch_size: 10
        order_inserts: true
        order_updates: true

logging:
  level:
    root: WARN
    com.zaphirio.retailapi: INFO

server:
  port: 8080
```

### Testing Phase 2

```bash
# Verify no Feign clients in classpath
grep -r "@FeignClient" backend/erphub-api/microservices/retail-api/src
# Should return: no results

# Verify product → brand relationship works
curl -H "Authorization: Bearer {token}" \
  http://localhost:9000/api/v1/products/1

# Verify no HTTP calls to other services (check logs)
# Should see local method calls only
```

### Dependencies for Phase 3

✅ Required before Phase 3:
- All Feign clients removed
- Services using direct calls
- RabbitMQ sync disabled
- Spring Cloud dependencies removed from pom.xml

---

## Phase 3: Implement Multi-Tenancy (Schema-Per-Tenant)
**Timeline**: Days 7-10 (4 days)  
**Owner**: Database Architect  
**Goal**: Implement tenant isolation with schema-per-tenant strategy

*(Detailed implementation in separate document: `03_PHASE3_MULTITENANT_ISOLATION.md`)*

---

## Phase 4: Fiscal Compliance & Immutability
**Timeline**: Days 11-14 (4 days)  
**Owner**: Domain Lead  
**Goal**: Make financial entities immutable, add audit trails

*(Detailed implementation in separate document: `04_PHASE4_FISCAL_COMPLIANCE.md`)*

---

## Phase 5: Production Hardening
**Timeline**: Days 15-21 (7 days)  
**Owner**: DevOps/SRE  
**Goal**: Add migrations, logging, monitoring, deployment readiness

*(Detailed implementation in separate document: `05_PHASE5_PRODUCTION_HARDENING.md`)*

---

## Integration Points Between Phases

```
Phase 1: Security
   ↓ (provides TenantContext)
Phase 2: Remove Artifacts
   ↓ (simplifies architecture)
Phase 3: Multi-Tenancy
   ↓ (uses security context)
Phase 4: Fiscal Compliance
   ↓ (requires transactional boundaries)
Phase 5: Production
   ↓ (adds observability)
Ready for MVP Launch
```

---

## Rollback Strategy

Each phase has a git checkpoint:

```bash
# After Phase 1 complete
git commit -m "refactor(security): enable jwt enforcement globally"

# After Phase 2 complete
git commit -m "refactor(arch): remove feign clients, use direct calls"

# After Phase 3 complete
git commit -m "refactor(multi-tenant): implement schema-per-tenant isolation"

# After Phase 4 complete
git commit -m "refactor(fiscal): immutable entities + audit logging"

# After Phase 5 complete
git commit -m "refactor(production): add migrations, logging, monitoring"

# Rollback example
git revert {commit-hash}
```

---

**Status**: Phase 1 ready to execute
**Next**: Execute Phase 1 (Security Hardening)
