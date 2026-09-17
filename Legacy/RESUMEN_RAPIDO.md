# Resumen Rápido - RetailManager Analysis

## 1. MODELO USER

### Backend User Entity
**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/auth/model/User.java` (63 líneas)

**Campo de Nombre**:
```java
@Column(nullable = false, length = 120)
private String fullName;  // ÚNICO campo, no firstName/lastName
```

**Campos Principales**:
- `id: UUID`
- `fullName: String` (120 chars)
- `email: String` (150 chars, unique)
- `role: Role` (ADMIN, MANAGER, EMPLOYEE)
- `status: UserStatus` (PENDING_VERIFICATION, ACTIVE)
- `tenantId: Long` (multi-tenancy)
- `createdAt, updatedAt: Instant`

### DTOs
1. **AuthResponse** (línea 17): Retorna `fullName` en login/refresh
2. **AuthMeResponse** (línea 5): Retorna `fullName` en GET /me

### Frontend User Interface
**Archivo**: `/frontend/web-client/src/app/core/auth/auth.store.ts` (línea 6-17)

```typescript
export interface User {
    id: string;
    email: string;
    fullName?: string;        // ← AQUÍ
    firstName?: string;       // ← NO USADO
    lastName?: string;        // ← NO USADO
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
    tenantId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
}
```

**Problema**: Frontend define firstName/lastName que backend NO envía.

---

## 2. AUTENTICACIÓN

### Endpoints
| Endpoint | Request | Response |
|----------|---------|----------|
| `POST /api/v1/auth/login` | {email, password} | {userId, fullName, email, role, status, accessToken, refreshToken} |
| `POST /api/v1/auth/logout` | {refreshToken} | {message} |
| `POST /api/v1/auth/logout-all` | {} | {message} |
| `POST /api/v1/auth/refresh` | {refreshToken} | {accessToken, refreshToken, ...} |
| `GET /api/v1/auth/me` | (Bearer token) | {id, fullName, email, role, status, tenantId} |

### Token Storage (Frontend)
**Archivo**: `/frontend/web-client/src/app/core/auth/token.service.ts` (166 líneas)

```typescript
// sessionStorage (NO localStorage)
ACCESS_TOKEN_KEY = 'access_token'
REFRESH_TOKEN_KEY = 'refresh_token'

// Se borra al cerrar tab
// SSR safe con isPlatformBrowser()
```

### Guards
**Archivo**: `/frontend/web-client/src/app/core/auth/auth.guard.ts` (85 líneas)

```typescript
export const authGuard    // Protege rutas autenticadas
export const noAuthGuard  // Protege rutas públicas de usuarios autenticados
export const roleGuard    // Verifica roles específicos
```

### PROBLEMA CRÍTICO: ReturnUrl no se procesa
**Ubicación**: `/frontend/web-client/src/app/features/auth/pages/login/login.component.ts` (línea 159)

```typescript
// ACTUAL (INCORRECTO)
this.router.navigate(['/dashboard']);  // Siempre a dashboard

// DEBERÍA SER
const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
this.router.navigate([returnUrl]);
```

---

## 3. COMPROBANTES (Invoice & Sale)

### Invoice (Compras a Proveedores)
**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/Invoice.java` (114 líneas)

✓ Tiene `TaxRegime taxRegime`
✓ Tiene `DocumentFinalizationStatus finalizationStatus`
✓ Tiene `String currency`

**Campos Impositivos**:
```
netValue0, netValue105, netValue21, netValue27
vat105, vat21, vat27
internalTax
withholdingVat, withholdingSuss, withholdingGrossReceiptsTax, withholdingIncome
```

### Sale (Ventas a Clientes)
**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/sales/model/Sale.java` (67 líneas)

✗ **FALTA** `TaxRegime taxRegime` → PROBLEMA CRÍTICO
✗ **FALTA** `DocumentFinalizationStatus finalizationStatus` → PROBLEMA CRÍTICO
✗ **FALTA** `String currency` → PROBLEMA ALTA

Tiene los mismos campos de totales que Invoice, pero sin régimen fiscal ni estado.

---

## 4. TIPOS DE DOCUMENTO

### Tipos Soportados
**Archivo**: `/frontend/web-client/src/app/pages/customer/customer-invoice/customer-invoice.component.ts` (línea 31-42)

```
FACTURA_A, FACTURA_B, FACTURA_C  (Facturas)
NC_A, NC_B, NC_C                 (Notas de Crédito)
ND_A, ND_B, ND_C                 (Notas de Débito)
PRESUPUESTO                       (Cotización)
```

### Rutas
**Archivo**: `/frontend/web-client/src/app/app.routes.ts` (línea 70-77)

```
/customerInvoice          → FACTURA_B (default)
/comprobantes/nota-credito → NC_B
/comprobantes/nota-debito → ND_B
/comprobantes/presupuesto → PRESUPUESTO
```

### TaxRegime Enum
**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/TaxRegime.java` (113 líneas)

```
IVA_RESPONSABLE        (Con IVA, 4 alícuotas: 0, 10.5, 21, 27)
MONOTRIBUTISTA         (Sin IVA deducible)
NO_INSCRIPTO          (Solo 21% VAT)
PEQUEÑO_CONTRIBUYENTE (0, 21%)
EXENTO                (0%)
```

### DocumentFinalizationStatus Enum
**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/DocumentFinalizationStatus.java` (92 líneas)

```
DRAFT              → editable
PENDING_APPROVAL   → editable
APPROVED           → read-only
FINALIZED          → INMUTABLE (cumplimiento AFIP)
CANCELED           → final
```

---

## 5. INCONSISTENCIAS CLAVE

### CRÍTICAS (C1)
1. **Sale sin TaxRegime** → No se registra régimen fiscal en ventas
2. **Sale sin FinalizationStatus** → No hay ciclo de vida de comprobantes
3. **Role Mismatch** → Backend (ADMIN/MANAGER/EMPLOYEE) vs Frontend (ADMIN/OPERATOR/VIEWER)

### ALTAS (A1)
1. **Sale sin currency** → Ambigüedad en multi-moneda
2. **PRESUPUESTO en Invoice table** → Debería ser documento separado (no fiscal)
3. **fullName vs firstName/lastName** → Inconsistencia de campos en User

### MEDIAS (M1)
1. **ReturnUrl no procesado** → Usuario forzado a dashboard
2. **SessionStorage trade-off** → Re-login en cada tab

---

## 6. ARCHIVOS CRÍTICOS

### Backend
```
/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/
├── auth/
│   ├── model/User.java                    (63 lines)
│   ├── service/AuthServiceImpl.java        (624 lines)
│   ├── controller/AuthController.java     (128 lines)
│   ├── dto/AuthResponse.java              (29 lines)
│   └── dto/AuthMeResponse.java            (13 lines)
├── operation/
│   ├── invoice/model/Invoice.java         (114 lines)
│   └── sales/model/Sale.java              (67 lines)
└── shared/fiscal/
    ├── TaxRegime.java                     (113 lines)
    └── DocumentFinalizationStatus.java    (92 lines)
```

### Frontend
```
/frontend/web-client/src/app/
├── core/auth/
│   ├── auth.guard.ts                      (85 lines)
│   ├── auth.service.ts                    (443 lines)
│   ├── auth.store.ts                      (148 lines)
│   └── token.service.ts                   (166 lines)
├── features/auth/
│   ├── auth.routes.ts                     (42 lines)
│   └── pages/login/login.component.ts     (169 lines)
├── pages/customer/
│   └── customer-invoice/...component.ts   (916 lines)
└── app.routes.ts                          (139 lines)
```

---

## 7. VERIFICACIÓN RÁPIDA

### Test Login Flow
```
1. POST /api/v1/auth/login
   ↓
2. Backend retorna: { userId, fullName, email, role, accessToken, refreshToken }
   ↓
3. Frontend almacena en sessionStorage
   ↓
4. Frontend redirige a /dashboard (SIEMPRE, no respeta returnUrl)
   ✗ PROBLEMA: Debería redirigir a returnUrl
```

### Test User Display
```
Backend retorna role: "MANAGER"
   ↓
Frontend normalizeRole() convierte a "VIEWER" (fallback)
   ✗ INCONSISTENCIA: MANAGER != VIEWER
```

### Test Invoice vs Sale
```
Invoice.java:
  ✓ TaxRegime taxRegime
  ✓ DocumentFinalizationStatus finalizationStatus
  ✓ String currency

Sale.java:
  ✗ FALTA TaxRegime
  ✗ FALTA DocumentFinalizationStatus
  ✗ FALTA currency
   ✗ CRÍTICO: No cumple AFIP
```

