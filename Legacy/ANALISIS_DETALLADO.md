# Análisis Detallado del Sistema RetailManager

**Fecha**: 2026-06-01  
**Versión**: 1.0

---

## TABLA DE CONTENIDOS
1. [Modelo User Actual](#1-modelo-user-actual)
2. [Autenticación y Logout](#2-autenticación-y-logout)
3. [Estructura de Comprobantes](#3-estructura-de-comprobantes)
4. [Tipos de Documento](#4-tipos-de-documento)
5. [Hallazgos y Problemas](#5-hallazgos-y-problemas)
6. [Inconsistencias Detectadas](#6-inconsistencias-detectadas)

---

## 1. MODELO USER ACTUAL

### 1.1 Entidad User en Backend

**Ubicación**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/auth/model/User.java`

**Campos Actuales**:
```java
@Entity
@Table(name = "tbl_users")
public class User implements Serializable {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @Column(nullable = false, length = 120)
    private String fullName;                    // Campo de nombre completo
    
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;                          // ADMIN, MANAGER, EMPLOYEE
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status;                  // PENDING_VERIFICATION, ACTIVE, etc.
    
    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;                      // Referencia a tenant para multi-tenancy
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
}
```

**Información Clave**:
- El campo `fullName` es un ÚNICO campo de nombre, no separado en firstName/lastName
- Tiene 120 caracteres de límite
- Se usa normalización en signup: `user.setFullName(normalizeFullName(request.fullName()))`
- Implementa `PrePersist` y `PreUpdate` para timestamps automáticos
- Soporta multi-tenancy con `tenantId` (Long, puede ser null)

### 1.2 DTOs Asociados

#### AuthResponse (usado al login)
```java
public record AuthResponse(
    UUID userId,
    String fullName,          // Retorna fullName (singular)
    String email,
    String role,
    String status,
    String accessToken,
    String refreshToken,
    String tokenType
) {
    public static AuthResponse from(User user, String accessToken, String refreshToken) {
        return new AuthResponse(
            user.getId(),
            user.getFullName(),   // Retorna el campo fullName
            user.getEmail(),
            user.getRole().name(),
            user.getStatus().name(),
            accessToken,
            refreshToken,
            "Bearer"
        );
    }
}
```

#### AuthMeResponse (endpoint /me)
```java
public record AuthMeResponse(
    UUID id,
    String fullName,          // Retorna fullName
    String email,
    String role,
    String status,
    Long tenantId
) {
}
```

### 1.3 Dónde se usa fullName en el código

#### Backend (Spring):
1. **AuthServiceImpl.java** (línea 77):
   ```java
   user.setFullName(normalizeFullName(request.fullName()));
   ```

2. **AuthServiceImpl.java** (línea 264, accept invite):
   ```java
   user.setFullName(normalizeFullName(request.fullName()));
   ```

3. **AuthResponse.from()** (línea 20):
   ```java
   user.getFullName()  // Retorna en AuthResponse
   ```

#### Frontend (Angular):
1. **auth.store.ts** (línea 9):
   ```typescript
   export interface User {
       id: string;
       email: string;
       fullName?: string;           // Campo opcional
       firstName?: string;          // Campo alternativo
       lastName?: string;           // Campo alternativo
       role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
   }
   ```

2. **auth.store.ts** (línea 57):
   ```typescript
   readonly userDisplayName = computed(() => {
       const user = this.currentUserSignal();
       if (!user) {
           return 'Usuario';
       }
       return user.fullName?.trim() || 'Usuario';  // Usa fullName si existe
   });
   ```

3. **LoginComponent** y otros componentes usan `store.userDisplayName()`

---

## 2. AUTENTICACIÓN Y LOGOUT

### 2.1 Flujo de Login/Logout en Backend

#### Login Flow:
```
LoginRequest (email, password)
    ↓
AuthServiceImpl.login()
    ├─ Normalizar email: normalizeEmail(request.email())
    ├─ Autenticar con AuthenticationManager
    ├─ Validar cuenta: validateAccountCanAuthenticate(user, account)
    ├─ Generar tokens: issueAuthTokens(user, account)
    │   ├─ Generar JWT access token con JwtService
    │   ├─ Generar refresh token y guardar en BD (RefreshToken table)
    │   └─ Retornar AuthResponse
    └─ Response: { userId, fullName, email, role, status, accessToken, refreshToken }
```

#### Logout Flow:
```
LogoutRequest (refreshToken)
    ↓
AuthServiceImpl.logout(refreshToken)
    ├─ Buscar RefreshToken en BD
    ├─ Validar token no esté revocado
    ├─ Marcar como revocado: token.setRevoked(true)
    ├─ Guardar: refreshTokenRepository.save(storedToken)
    └─ Response: MessageResponse("Logout successful")
```

#### Logout All (revocar todas las sesiones):
```
Requiere: JWT accessToken válido
    ↓
AuthServiceImpl.logoutAll(userId)
    ├─ Encontrar todos los RefreshToken del usuario
    ├─ Revocar todos: token.setRevoked(true)
    └─ Guardar cambios
```

### 2.2 Endpoints de Autenticación

**Base URL**: `http://localhost:8080/api/v1/auth`

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---|---|
| `/login` | POST | Pública | Autenticar usuario con email/password |
| `/logout` | POST | Pública | Revocar refresh token específico |
| `/logout-all` | POST | JWT | Revocar todas las sesiones del usuario |
| `/refresh` | POST | Pública | Generar nuevo access token con refresh token |
| `/me` | GET | JWT | Obtener datos del usuario autenticado |
| `/registration/signup` | POST | Pública | Registro de nuevo usuario |
| `/registration/verify-email` | POST | Pública | Verificar email con código de 6 dígitos |
| `/password/forgot` | POST | Pública | Solicitar reset de password |
| `/password/reset` | POST | Pública | Completar reset de password |

**Detalles de EndPoints**:

#### POST /api/v1/auth/login
```
Request: { email: "user@example.com", password: "password123" }
Response: {
    userId: UUID,
    fullName: "Juan Pérez",
    email: "user@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    accessToken: "eyJhbGc...",
    refreshToken: "550e8400-e29b-41d4-a716-446655440000",
    tokenType: "Bearer"
}
```

#### POST /api/v1/auth/logout
```
Request: { refreshToken: "550e8400-e29b-41d4-a716-446655440000" }
Response: { message: "Logout successful" }
```

#### POST /api/v1/auth/refresh
```
Request: { refreshToken: "550e8400-e29b-41d4-a716-446655440000" }
Response: {
    userId: UUID,
    fullName: "Juan Pérez",
    email: "user@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    accessToken: "eyJhbGc...",
    refreshToken: "new-uuid-token",
    tokenType: "Bearer"
}
```

#### GET /api/v1/auth/me
```
Headers: Authorization: Bearer <accessToken>
Response: {
    id: UUID,
    fullName: "Juan Pérez",
    email: "user@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    tenantId: 123
}
```

### 2.3 Almacenamiento de Tokens (Frontend)

**Ubicación**: `/frontend/web-client/src/app/core/auth/token.service.ts`

**Configuración Actual**:
```typescript
private readonly ACCESS_TOKEN_KEY = 'access_token';
private readonly REFRESH_TOKEN_KEY = 'refresh_token';

// Almacenamiento: sessionStorage (NO localStorage)
setAccessToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);  // Se borra al cerrar pestaña
    }
}

setRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);  // Se borra al cerrar pestaña
    }
}
```

**Consideraciones Importantes**:
- Usa **sessionStorage** (NOT localStorage) - tokens se pierden al cerrar tab
- Tiene verificación de plataforma con `isPlatformBrowser()` para SSR safety
- Decodifica JWT con `jwtDecode` para verificar expiración
- Expiration check en `isTokenExpired()`

### 2.4 Guards de Rutas Protegidas

**Ubicación**: `/frontend/web-client/src/app/core/auth/auth.guard.ts`

#### authGuard - Protege rutas autenticadas
```typescript
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (authService.isLoggedIn()) {
        return true;  // Permitir acceso
    }
    
    // Redirigir a login si no autenticado
    return router.createUrlTree(['/landing/login'], {
        queryParams: { returnUrl: state.url }
    });
};
```

**Usado en**:
- `/dashboard` - Dashboard principal
- `/products`, `/customers`, `/suppliers` - Todas las rutas protegidas
- `/landing` - Rutas publicas (auth)

#### noAuthGuard - Protege rutas de auth de usuarios autenticados
```typescript
export const noAuthGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!authService.isLoggedIn()) {
        return true;  // Permitir acceso si NO está autenticado
    }
    
    // Redirigir a dashboard si ya está autenticado
    return router.createUrlTree(['/dashboard']);
};
```

**Usado en**:
- `/landing/login` - Login page
- `/landing/signup` - Signup page
- `/landing/password-recovery` - Password recovery page

### 2.5 Rutas Protegidas en app.routes.ts

**Ubicación**: `/frontend/web-client/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
    // Auth / Landing (sin protección o con noAuthGuard)
    {
        path: 'landing',
        loadChildren: () => import('./features/auth/auth.routes')
        // Usa noAuthGuard internamente
    },
    
    // Dashboard (con authGuard)
    { path: 'dashboard', component: DashboardHomeComponent, canActivate: [authGuard] },
    { path: 'dashboard/profile', loadComponent: ..., canActivate: [authGuard] },
    { path: 'dashboard/settings', loadComponent: ..., canActivate: [authGuard] },
    
    // Catálogo (con authGuard)
    { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
    { path: 'products/:id', component: ProductDetailsComponent, canActivate: [authGuard] },
    
    // Comprobantes/Facturación (con authGuard)
    { path: 'customerInvoice', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'FACTURA_B' } },
    { path: 'comprobantes/nota-credito', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'NC_B' } },
    { path: 'comprobantes/presupuesto', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'PRESUPUESTO' } },
    
    // Entrada por defecto
    { path: '', redirectTo: 'landing/login', pathMatch: 'full' },
    { path: '**', redirectTo: 'landing/login', pathMatch: 'full' }
];
```

**Configuración de Rutas Auth**:

Ubicación: `/frontend/web-client/src/app/features/auth/auth.routes.ts`

```typescript
export const authRoutes: Routes = [
    {
        path: '',
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
            { 
                path: 'login',
                component: LoginComponent,
                canActivate: [noAuthGuard],
                data: { title: 'Sign In' }
            },
            { 
                path: 'signup',
                component: SignupComponent,
                canActivate: [noAuthGuard],
                data: { title: 'Create Account' }
            },
            { 
                path: 'password-recovery',
                component: PasswordRecoveryComponent,
                canActivate: [noAuthGuard],
                data: { title: 'Reset Password' }
            },
            { 
                path: 'email-verification',
                component: EmailVerificationComponent,
                // NO tiene noAuthGuard - puede accederse después de signup
                data: { title: 'Verify Email' }
            }
        ]
    }
];
```

### 2.6 Redirección Incorrecto - PROBLEMA CRÍTICO

**Ubicación del Problema**: `authGuard` en `/app/core/auth/auth.guard.ts` línea 26

```typescript
return router.createUrlTree(['/landing/login'], {
    queryParams: { returnUrl: state.url }
});
```

**El Problema**:
- Cuando usuario no autenticado trata de acceder ruta protegida
- Se redirige a `/landing/login` 
- Pero luego de login exitoso, el código NOT REDIRIGE AL returnUrl

**Razón**: No hay código en `LoginComponent` que procese el `returnUrl` query parameter

**Ubicación**: `/frontend/web-client/src/app/features/auth/pages/login/login.component.ts` líneas 145-169

```typescript
onSubmit(): void {
    if (!this.form.valid) {
        return;
    }
    
    this.store.setIsLoading(true);
    // ... código de login ...
    
    this.authService.login(email, password).subscribe({
        next: (response) => {
            this.router.navigate(['/dashboard']);  // REDIRECCIÓN FIJA A DASHBOARD
            // NO usa returnUrl ❌
        },
        error: (error) => {
            this.store.setError(error.userMessage);
        }
    });
}
```

**Solución Requerida**:
```typescript
onSubmit(): void {
    // ... validación ...
    
    this.authService.login(email, password).subscribe({
        next: () => {
            // Leer returnUrl del query param
            this.route.queryParams.pipe(
                take(1),
                map(params => params['returnUrl'] || '/dashboard'),
                switchMap(returnUrl => this.router.navigate([returnUrl]))
            ).subscribe();
        }
    });
}
```

### 2.7 Flujo de Sesión - Session Check en Startup

**Ubicación**: `auth.service.ts` línea 87-130

```typescript
private checkExistingSession(): void {
    const token = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    const fallbackUser = this.buildUserFromToken();
    
    // Si hay token y no hay usuario en store
    if (fallbackUser && !this.store.currentUser()) {
        this.store.setCurrentUser(fallbackUser);
    }
    
    // Token válido y no expirado
    if (token && !this.tokenService.isTokenExpired()) {
        this.getCurrentUser().subscribe({
            next: () => {
                this.isLoggedInSubject.next(true);
            },
            error: () => {
                if (this.store.currentUser()) {
                    this.isLoggedInSubject.next(true);
                    return;
                }
                // Token inválido - clear state
                this.tokenService.clearAccessToken();
                this.store.clear();
                this.isLoggedInSubject.next(false);
            }
        });
    } else if (token && this.tokenService.isTokenExpired()) {
        // Token expirado - intentar refresh
        if (!refreshToken) {
            this.handleSessionExpired();
            return;
        }
        
        this.refreshToken().subscribe({
            next: () => {
                this.isLoggedInSubject.next(true);
            },
            error: () => {
                this.handleSessionExpired();
            }
        });
    }
}
```

---

## 3. ESTRUCTURA DE COMPROBANTES

### 3.1 Entidades Invoice/Factura en Backend

**Ubicación**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/Invoice.java`

```java
@Entity
@Table(name = "tbl_supplier_invoice")
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private UUID supplierId;
    private UUID branchId;
    private UUID locationId;
    
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate receptionDate;
    private LocalDate savedDate;
    
    // Información del comprobante
    private String invoiceType;      // Tipo de factura (FACTURA, NC, ND, etc)
    private String invoiceNumber;    // Número de comprobante
    private String packingListNumber;
    
    // Flags
    private boolean fixedAsset;
    private boolean taxSave;
    private String observations;
    
    // ─── Totales y Subtotales ───────────────
    private double subtotal1;        // Subtotal sin descuentos
    private Double discount;
    private double interest;
    private double subtotal2;        // Subtotal después de descuentos
    
    // ─── Importes por Alícuota de IVA ──────
    // Campos separados para cada tasa impositiva argentina
    private double netValue0;        // Importe neto sin IVA
    private double netValue105;      // Importe neto con IVA 10.5%
    private double netValue21;       // Importe neto con IVA 21%
    private double netValue27;       // Importe neto con IVA 27%
    
    private double vat105;           // IVA 10.5%
    private double vat21;            // IVA 21%
    private double vat27;            // IVA 27%
    
    // ─── Impuestos Internos ────────────────
    private double internalTax;      // Impuestos internos/especiales
    
    // ─── Retenciones ───────────────────────
    private double withholdingVat;              // Retención IVA
    private double withholdingSuss;             // Retención SUSS
    private double withholdingGrossReceiptsTax; // Retención Ingresos Brutos
    private double withholdingIncome;           // Retención Ganancias
    private double stateTax;                    // Impuestos provinciales
    private double localTax;                    // Impuestos municipales
    
    private double rounding;
    private double totalPrice;       // Total final
    
    private String currency;         // Moneda usada (ARS, USD, etc)
    
    // ─── Multi-Tenancy ────────────────────
    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;
    
    // ─── Régimen Fiscal ───────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_regime", nullable = false)
    @ImmutableField(editableBeforeFinalization = true)
    private TaxRegime taxRegime;  // IVA_RESPONSABLE, MONOTRIBUTISTA, NO_INSCRIPTO, etc.
    
    // ─── Estado de Finalización ─────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "finalization_status", nullable = false)
    private DocumentFinalizationStatus finalizationStatus = DocumentFinalizationStatus.DRAFT;
    
    @Column(name = "finalized_at")
    @ImmutableField(editableBeforeFinalization = false)
    private Instant finalizedAt;
    
    @Column(name = "finalized_by_user_id")
    @ImmutableField(editableBeforeFinalization = false)
    private UUID finalizedByUserId;
    
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    List<InvoiceItem> invoiceItems = new ArrayList<>();
    
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    List<OtherConcept> otherConcepts = new ArrayList<>();
}
```

**Moneda Usada**: Campo `currency` (String) - Sin restricción a moneda específica, pero sistema está diseñado para Argentina en ARS.

### 3.2 Entidad Sale (Venta a Clientes)

**Ubicación**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/sales/model/Sale.java`

```java
@Entity
@Table(name = "tbl_sales")
public class Sale {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private UUID customerId;
    private UUID branchId;
    private UUID locationId;
    
    private LocalDate saleDate;
    
    // Información del comprobante
    private String saleType;         // Tipo de venta (FACTURA_A, FACTURA_B, etc)
    private String saleNumber;       // Número de comprobante
    
    // Ítems
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();
    
    // ─── Totales similares a Invoice ───────
    private double subtotal1;
    private double discount;
    private double interest;
    private double subtotal2;
    
    private double netValue0;
    private double netValue105;
    private double netValue21;
    private double netValue27;
    
    private double vat105;
    private double vat21;
    private double vat27;
    private double internalTax;
    
    private double withholdingVat;
    private double withholdingSuss;
    private double withholdingGrossReceiptsTax;
    private double withholdingIncome;
    private double stateTax;
    private double localTax;
    private double rounding;
    
    private double totalPrice;
    private String observations;
    
    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;
}
```

**NO TIENE**:
- `TaxRegime` - Régimen fiscal no está implementado en Sales
- `DocumentFinalizationStatus` - Estados de finalización no implementados
- `currency` - Campo de moneda no existe

---

## 4. TIPOS DE DOCUMENTO

### 4.1 Tipos de Comprobantes Soportados

**Ubicación en Frontend**: `/frontend/web-client/src/app/pages/customer/customer-invoice/customer-invoice.component.ts` líneas 31-42

```typescript
readonly voucherTypeOptions: Array<{ value: string; label: string }> = [
    { value: 'FACTURA_A', label: 'Factura A' },        // Factura de régimen IVA Responsable
    { value: 'FACTURA_B', label: 'Factura B' },        // Factura de consumidor final
    { value: 'FACTURA_C', label: 'Factura C' },        // Factura sin discriminación de IVA
    { value: 'NC_A', label: 'Nota de credito A' },     // Nota de crédito A (tax invoice)
    { value: 'NC_B', label: 'Nota de credito B' },     // Nota de crédito B (consumer)
    { value: 'NC_C', label: 'Nota de credito C' },     // Nota de crédito C
    { value: 'ND_A', label: 'Nota de debito A' },      // Nota de débito A
    { value: 'ND_B', label: 'Nota de debito B' },      // Nota de débito B
    { value: 'ND_C', label: 'Nota de debito C' },      // Nota de débito C
    { value: 'PRESUPUESTO', label: 'Presupuesto' },    // Presupuesto (Quote/Cotización)
];

// Default
defaultVoucherType = 'FACTURA_B';
```

### 4.2 Rutas para Cada Tipo de Comprobante

**Ubicación**: `/frontend/web-client/src/app/app.routes.ts` líneas 70-77

```typescript
// ── Ventas / Comprobantes ──────────────────────────
{ path: 'customerInvoice',             component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'FACTURA_B' } },
{ path: 'comprobantes/nota-credito',   component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'NC_B' } },
{ path: 'comprobantes/nota-debito',    component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'ND_B' } },
{ path: 'comprobantes/presupuesto',    component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'PRESUPUESTO' } },
{ path: 'comprobantes/ver',            component: CustomerVoucherListComponent, canActivate: [authGuard] },
{ path: 'comprobantes/ver/:id',        component: CustomerVoucherDetailComponent, canActivate: [authGuard] },
```

### 4.3 Tipos de Documento - Nomenclatura Argentina

**Facturas (Comprobantes de Venta)**:
- **Factura A**: Para cliente IVA Responsable - discrimina IVA
- **Factura B**: Para consumidor final - sin discriminación de IVA
- **Factura C**: Para comprador no IVA (excepto responsable) - sin IVA

**Notas de Crédito (NC)**: Documentos de ajuste por devolución/descuento
- **NC A, B, C**: Corresponden a los mismos tipos de factura

**Notas de Débito (ND)**: Documentos de ajuste por cobro adicional
- **ND A, B, C**: Corresponden a los mismos tipos de factura

**Presupuesto**: Cotización no vinculante (no fiscal)

### 4.4 Sistema de Enumeraciones

**TaxRegime** - Regímenes Fiscales Argentinos:

```java
public enum TaxRegime {
    IVA_RESPONSABLE(
        "IVA Responsable Inscripto",
        issuesTaxInvoices: true,      // Emite facturas con IVA
        canClaimInputVAT: true,       // Puede deducir IVA de compras
        applicableVATRates: [0, 10.5, 21, 27]
    ),
    MONOTRIBUTISTA(
        "Monotributista",
        issuesTaxInvoices: false,
        canClaimInputVAT: false,
        applicableVATRates: [0]
    ),
    NO_INSCRIPTO(
        "No Inscripto",
        issuesTaxInvoices: false,
        canClaimInputVAT: false,
        applicableVATRates: [21]
    ),
    PEQUEÑO_CONTRIBUYENTE(
        "Pequeño Contribuyente",
        issuesTaxInvoices: true,
        canClaimInputVAT: false,
        applicableVATRates: [0, 21]
    ),
    EXENTO(
        "Exento",
        issuesTaxInvoices: false,
        canClaimInputVAT: false,
        applicableVATRates: [0]
    )
}
```

**DocumentFinalizationStatus** - Ciclo de Vida de Comprobantes:

```
DRAFT (editable)
    ↓
PENDING_APPROVAL (editable)
    ↓
APPROVED (NO editable - read-only)
    ↓
FINALIZED (INMUTABLE - no cambios permitidos)
    ↓
CANCELED (final state)
```

---

## 5. HALLAZGOS Y PROBLEMAS

### 5.1 Problema: Redirección post-login incompleta

**Severidad**: MEDIA

**Ubicación**: 
- Backend: Correcto (retorna tokens)
- Frontend: `/features/auth/pages/login/login.component.ts` línea 159

**Problema**:
```typescript
// Código actual
this.router.navigate(['/dashboard']);  // Siempre va a dashboard

// Debería ser
const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
this.router.navigate([returnUrl]);
```

**Impacto**: Usuario es forzado a dashboard después de login, no respeta `returnUrl` query param establecido por `authGuard`.

### 5.2 Problema: Inconsistencia en campos de nombre de usuario

**Severidad**: MEDIA

**Ubicación**:
- Backend: Usa `fullName` (singular)
- Frontend (auth.store.ts): Define `fullName`, `firstName`, `lastName` (plural/alternativo)

**Problema**:
```typescript
// Frontend auth.store.ts define:
export interface User {
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

// Backend retorna solo:
{
    fullName: "Juan Pérez",
    // firstName y lastName NO se envían
}
```

**Impacto**: Código frontend prepara para firstName/lastName que no llega del backend.

### 5.3 Problema: Sale NO tiene TaxRegime implementado

**Severidad**: ALTA

**Ubicación**:
- `Invoice.java`: ✓ Tiene `@Enumerated TaxRegime taxRegime`
- `Sale.java`: ✗ NO tiene campo `taxRegime`

**Problema**:
```java
// Invoice (correcto)
@Enumerated(EnumType.STRING)
@Column(name = "tax_regime", nullable = false)
private TaxRegime taxRegime;

// Sale (FALTA)
// No existe campo taxRegime
```

**Impacto**: Ventas a clientes no registran régimen fiscal, incumple AFIP Argentina.

### 5.4 Problema: Sale NO tiene DocumentFinalizationStatus

**Severidad**: ALTA

**Ubicación**:
- `Invoice.java`: ✓ Tiene `finalizationStatus`, `finalizedAt`, `finalizedByUserId`
- `Sale.java`: ✗ No tiene estos campos

**Problema**: No hay control de ciclo de vida de comprobantes de venta (DRAFT → FINALIZED).

**Impacto**: Imposible cumplir AFIP con inmutabilidad de comprobantes finalizados.

### 5.5 Problema: Sale NO tiene campo currency

**Severidad**: MEDIA

**Ubicación**:
- `Invoice.java`: ✓ Tiene `private String currency;`
- `Sale.java`: ✗ NO tiene currency

**Problema**: No hay registro de moneda en ventas.

**Impacto**: Ambigüedad en sistema de múltiples monedas (ARS, USD, etc).

---

## 6. INCONSISTENCIAS DETECTADAS

### 6.1 Inconsistencia: Invoice vs Sale - Estructura desalineada

| Propiedad | Invoice | Sale | Consistencia |
|-----------|---------|------|---|
| `id` | UUID | UUID | ✓ OK |
| `taxRegime` | TaxRegime enum | **FALTA** | ✗ INCONSISTENTE |
| `finalizationStatus` | DocumentFinalizationStatus | **FALTA** | ✗ INCONSISTENTE |
| `currency` | String | **FALTA** | ✗ INCONSISTENTE |
| `invoiceType`/`saleType` | String | String | ✓ OK |
| `invoiceNumber`/`saleNumber` | String | String | ✓ OK |
| VAT calculations | netValue*, vat* | netValue*, vat* | ✓ OK |
| Withholding taxes | withholding* | withholding* | ✓ OK |

**Impacto**: Sale y Invoice son entidades paralelas pero Sin estándares consistentes.

### 6.2 Inconsistencia: Token Storage - sessionStorage vs localStorage

**Ubicación**: `/app/core/auth/token.service.ts`

```typescript
// Actual: sessionStorage
setAccessToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);  // Se borra al cerrar tab
    }
}

// Consideración: Algunos sistemas usan localStorage
// localStorage: Persiste entre sesiones (riesgoso sin HTTPS)
// sessionStorage: Más seguro, se borra al cerrar tab
```

**Análisis**: 
- ✓ SessionStorage es correcto para SSR safety
- ✓ Appropriado para aplicaciones web estándar
- ⚠ Puede ser incómodo para usuario (requiere re-login cada tab)

### 6.3 Inconsistencia: User roles normalization

**Ubicación**: `/frontend/web-client/src/app/core/auth/auth.store.ts` línea 91-98

```typescript
private normalizeRole(role: unknown): User['role'] {
    const value = typeof role === 'string' ? role.toUpperCase() : 'VIEWER';
    
    if (value === 'ADMIN' || value === 'OPERATOR' || value === 'VIEWER') {
        return value;
    }
    
    return 'VIEWER';  // Default fallback
}
```

**Backend retorna** (AuthResponse):
```java
user.getRole().name()  // Retorna Role enum name: "ADMIN", "MANAGER", "EMPLOYEE"
```

**Problema**:
- Backend retorna: `ADMIN`, `MANAGER`, `EMPLOYEE` (3 roles)
- Frontend espera: `ADMIN`, `OPERATOR`, `VIEWER` (3 roles diferentes)
- Mismatch de nombres de roles

**Impacto**: Role `MANAGER` del backend se convierte a `VIEWER` en frontend (fallback).

### 6.4 Inconsistencia: Presupuesto - ¿Es documento fiscal o no?

**Ubicación**:
- Frontend: `/app/pages/customer/customer-invoice/customer-invoice.component.ts` línea 41
- Rutas: `/app/app.routes.ts` línea 73

```typescript
// Frontend trata PRESUPUESTO como un tipo más de comprobante
{ value: 'PRESUPUESTO', label: 'Presupuesto' },

// Pero se crea en la MISMA entidad que facturas:
{ path: 'comprobantes/presupuesto', component: CustomerInvoiceComponent, ... }
```

**Problema**: 
- Presupuesto NO es un comprobante fiscal AFIP
- NO requiere numeración secuencial
- NO es inmutable
- Debería tener entidad separada

**Impacto**: Mezcla comprobantes fiscales (obligatorios) con presupuestos (administrativos).

---

## RESUMEN EJECUTIVO DE INCONSISTENCIAS

### Críticas (DEBE FIX):
1. ❌ **Sale sin `taxRegime`** - Incumplimiento AFIP
2. ❌ **Sale sin `finalizationStatus`** - Imposible inmutabilidad fiscal
3. ❌ **Mismatch de roles** - Backend (ADMIN/MANAGER/EMPLOYEE) vs Frontend (ADMIN/OPERATOR/VIEWER)

### Altas (DEBE MEJORAR):
1. ⚠️ **Sale sin `currency`** - Ambigüedad en multi-moneda
2. ⚠️ **Presupuesto mezclado con facturas** - Debería ser documento separado
3. ⚠️ **User model: fullName vs firstName/lastName** - Inconsistencia de campos

### Medias (CONSIDERAR):
1. ⚠️ **ReturnUrl no procesado en login** - UX pobre
2. ⚠️ **SessionStorage vs LocalStorage** - Tradeoff seguridad/conveniencia

---

## ARCHIVOS CLAVE PARA REFERENCIA

### Backend:
- User Model: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/auth/model/User.java`
- AuthServiceImpl: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/auth/service/AuthServiceImpl.java`
- AuthController: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/auth/controller/AuthController.java`
- Invoice Model: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/Invoice.java`
- Sale Model: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/sales/model/Sale.java`
- TaxRegime: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/TaxRegime.java`
- DocumentFinalizationStatus: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/DocumentFinalizationStatus.java`

### Frontend:
- AuthGuard: `/frontend/web-client/src/app/core/auth/auth.guard.ts`
- AuthService: `/frontend/web-client/src/app/core/auth/auth.service.ts`
- TokenService: `/frontend/web-client/src/app/core/auth/token.service.ts`
- AuthStore: `/frontend/web-client/src/app/core/auth/auth.store.ts`
- LoginComponent: `/frontend/web-client/src/app/features/auth/pages/login/login.component.ts`
- App Routes: `/frontend/web-client/src/app/app.routes.ts`
- Auth Routes: `/frontend/web-client/src/app/features/auth/auth.routes.ts`
- CustomerInvoiceComponent: `/frontend/web-client/src/app/pages/customer/customer-invoice/customer-invoice.component.ts`

---

**Fin del análisis**
