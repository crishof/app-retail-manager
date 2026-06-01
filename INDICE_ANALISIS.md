# Índice de Análisis RetailManager

**Fecha de Análisis**: 2026-06-01  
**Estado**: Completado

---

## 📚 Documentos Disponibles

### 1. **RESUMEN_RAPIDO.md** (8 KB, 257 líneas)
Referencia rápida para encontrar problemas específicos
- Ubicaciones exactas de archivos con números de línea
- Tabla de endpoints de autenticación
- Comparativa rápida de inconsistencias
- Verificación rápida de flujos
- **Ideal para**: Consultas puntuales, debugging rápido

### 2. **ANALISIS_DETALLADO.md** (32 KB, 1021 líneas)
Análisis profundo con contexto completo
- Código fuente integrado en el documento
- Explicación detallada de cada flujo
- Análisis de impacto de problemas
- Soluciones propuestas
- **Ideal para**: Arquitectos, planificación de fixes, documentación

---

## 🎯 Resumen de Hallazgos

### Problemas Identificados: 8

#### CRÍTICOS (3)
1. **Sale sin TaxRegime** → Incumplimiento AFIP
2. **Sale sin FinalizationStatus** → Imposible ciclo de vida de comprobantes
3. **Mismatch de Roles** → Backend (ADMIN/MANAGER/EMPLOYEE) vs Frontend (ADMIN/OPERATOR/VIEWER)

#### ALTOS (3)
1. **Sale sin currency** → Ambigüedad en multi-moneda
2. **PRESUPUESTO mezclado** → Debería ser documento separado
3. **fullName vs firstName/lastName** → Inconsistencia en User model

#### MEDIOS (2)
1. **ReturnUrl no procesado** → Usuario forzado a dashboard en login
2. **SessionStorage trade-off** → Requiere re-login en cada tab

---

## 📍 Ubicaciones Clave

### Backend
```
Backend: /backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/

Auth Module:
  ├── model/User.java (63 líneas)
  │   └─ Campo: fullName (única referencia de nombre)
  │
  ├── service/AuthServiceImpl.java (624 líneas)
  │   ├─ login() - Línea 111
  │   ├─ logout() - Línea 139
  │   ├─ refreshToken() - Línea 175
  │   └─ verifyEmail() - Línea 180
  │
  ├── controller/AuthController.java (128 líneas)
  │   ├─ POST /login - Línea 48
  │   ├─ POST /logout - Línea 64
  │   ├─ POST /logout-all - Línea 83
  │   ├─ POST /refresh - Línea 104
  │   └─ GET /me - Línea 124
  │
  ├── dto/AuthResponse.java (29 líneas)
  │   └─ Retorna: fullName (línea 9)
  │
  └── dto/AuthMeResponse.java (13 líneas)
      └─ Retorna: fullName (línea 7)

Invoice Module:
  ├── model/Invoice.java (114 líneas)
  │   ├─ ✓ TaxRegime taxRegime (línea 86-88)
  │   ├─ ✓ DocumentFinalizationStatus finalizationStatus (línea 95-97)
  │   └─ ✓ String currency (línea 77)
  │
  ├── model/Sale.java (67 líneas)
  │   ├─ ✗ NO TIENE taxRegime
  │   ├─ ✗ NO TIENE finalizationStatus
  │   └─ ✗ NO TIENE currency
  │
  └── shared/fiscal/
      ├── TaxRegime.java (113 líneas)
      │   └─ Enum: IVA_RESPONSABLE, MONOTRIBUTISTA, NO_INSCRIPTO, PEQUEÑO_CONTRIBUYENTE, EXENTO
      │
      └── DocumentFinalizationStatus.java (92 líneas)
          └─ Enum: DRAFT, PENDING_APPROVAL, APPROVED, FINALIZED, CANCELED
```

### Frontend
```
Frontend: /frontend/web-client/src/app/

Auth Module:
  ├── core/auth/auth.guard.ts (85 líneas)
  │   ├─ authGuard() - Protege rutas autenticadas
  │   │   └─ setea returnUrl (línea 26-28) pero NO se procesa
  │   ├─ noAuthGuard() - Protege rutas públicas
  │   └─ roleGuard() - Verifica roles específicos
  │
  ├── core/auth/auth.service.ts (443 líneas)
  │   ├─ login() - Línea 139
  │   ├─ logout() - Línea 173
  │   └─ checkExistingSession() - Línea 87
  │
  ├── core/auth/auth.store.ts (148 líneas)
  │   ├─ Interface User (línea 6-17)
  │   │   └─ Define: fullName, firstName, lastName (NO usado)
  │   │
  │   ├─ userDisplayName - Usa fullName (línea 51-58)
  │   └─ normalizeRole() - Convierte MANAGER a VIEWER (línea 91-98)
  │
  ├── core/auth/token.service.ts (166 líneas)
  │   └─ Usa sessionStorage (NO localStorage)
  │       └─ SSR-safe con isPlatformBrowser()
  │
  ├── features/auth/auth.routes.ts (42 líneas)
  │   └─ Rutas: login, signup, password-recovery, email-verification
  │
  ├── features/auth/pages/login/login.component.ts (169 líneas)
  │   └─ ❌ PROBLEMA: Redirección fija a /dashboard (línea 159)
  │       No procesa returnUrl del query param
  │
  ├── pages/customer/customer-invoice/customer-invoice.component.ts (916 líneas)
  │   ├─ voucherTypeOptions (línea 31-42)
  │   │   └─ 10 tipos: FACTURA_A/B/C, NC_A/B/C, ND_A/B/C, PRESUPUESTO
  │   │
  │   └─ defaultVoucherType = 'FACTURA_B' (línea 93)
  │
  └── app.routes.ts (139 líneas)
      ├─ Rutas con authGuard
      ├─ Rutas de comprobantes (línea 70-77)
      │   └─ /comprobantes/presupuesto usa CustomerInvoiceComponent
      │
      └─ Ruta entrada: '' → '/landing/login'
```

---

## 🔍 Análisis por Tema

### 1. Modelo User
**Status**: ⚠️ Inconsistencia media
- Backend: campo único `fullName`
- Frontend: define `fullName`, `firstName`, `lastName`
- Impacto: Código frontend preparado para campos que no existen en backend
- Solución: Unificar en un solo enfoque

### 2. Autenticación y Logout
**Status**: ✓ Backend OK, ⚠️ Frontend parcial
- Backend: Correcto - login, logout, refresh tokens con BD
- Frontend: SessionStorage OK, pero returnUrl NO se procesa
- Impacto: Usuario forzado a dashboard después de login
- Solución: Implementar procesamiento de returnUrl en LoginComponent

### 3. Comprobantes - Invoice vs Sale
**Status**: ❌ CRÍTICO - Desalineación
- Invoice: ✓ TaxRegime ✓ FinalizationStatus ✓ Currency
- Sale: ✗ FALTA todo
- Impacto: Sale no cumple AFIP, sin ciclo de vida, ambigüedad multi-moneda
- Solución: Adicionar los 3 campos a Sale.java

### 4. Tipos de Documento
**Status**: ✓ OK con observación
- 10 tipos: Facturas A/B/C, Notas de Crédito/Débito, Presupuesto
- Problema: Presupuesto NO es fiscal pero está en la misma tabla
- Solución: Separar Presupuesto a entidad/tabla diferente

### 5. Régimen Fiscal (TaxRegime)
**Status**: ✓ Backend OK, ⚠️ Sale sin implementar
- Enum: IVA_RESPONSABLE, MONOTRIBUTISTA, NO_INSCRIPTO, PEQUEÑO_CONTRIBUYENTE, EXENTO
- Problema: Sale no registra régimen fiscal
- Solución: Adicionar TaxRegime taxRegime a Sale.java

### 6. Estado de Finalización
**Status**: ✓ Backend OK, ⚠️ Sale sin implementar
- Enum: DRAFT → PENDING_APPROVAL → APPROVED → FINALIZED → CANCELED
- Problema: Sale no tiene ciclo de vida
- Solución: Adicionar DocumentFinalizationStatus a Sale.java

### 7. Roles de Usuario
**Status**: ❌ CRÍTICO - Mismatch
- Backend: ADMIN, MANAGER, EMPLOYEE
- Frontend: ADMIN, OPERATOR, VIEWER
- Problema: MANAGER mapea a VIEWER (fallback)
- Solución: Alinear roles en ambas capas

### 8. Almacenamiento de Tokens
**Status**: ✓ OK
- Usa sessionStorage (no localStorage)
- SSR-safe con isPlatformBrowser()
- Tokens se pierden al cerrar tab (esperado)

---

## 📊 Estadísticas

- **Archivos analizados**: 35+
- **Líneas de código**: 2000+
- **Problemas identificados**: 8
- **Archivos generados**: 2
- **Severidad Crítica**: 3
- **Severidad Alta**: 3
- **Severidad Media**: 2

---

## 🚀 Recomendaciones de Prioridad

### INMEDIATO (Semana 1)
1. Adicionar TaxRegime a Sale.java
2. Adicionar DocumentFinalizationStatus a Sale.java
3. Procesar returnUrl en LoginComponent

### CORTO PLAZO (Semana 2)
4. Adicionar currency a Sale.java
5. Alinear roles Backend/Frontend
6. Unificar campos de nombre en User

### MEDIO PLAZO (Semana 3+)
7. Separar Presupuesto a entidad diferente
8. Auditar impacto en DB migrations

---

## 📖 Cómo Usar Este Análisis

1. **Para entender rápidamente**: Leer RESUMEN_RAPIDO.md
2. **Para arquitectura**: Leer ANALISIS_DETALLADO.md
3. **Para implementar fixes**: Referirse a líneas específicas aquí
4. **Para código fuente**: Ver ANALISIS_DETALLADO.md con snippets

---

**Generado**: 2026-06-01  
**Versión**: 1.0  
**Estado**: Completo y validado
