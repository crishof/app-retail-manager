# FASE 3 — Auditoría de Multitenancy (estado real)

> Auditoría **solo lectura**. Verificada leyendo código real. Todas las rutas son absolutas o relativas a la raíz del repo `/Users/cristian/proyectos/app-retailmanager`.
> Prefijo backend usado en las citas: `backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/` (abreviado como `…/retailapi/`).

## Conclusión ejecutiva

La premisa "no hay tenancy, se parte de cero" es **FALSA**. Existe infraestructura de tenancy **PARCIAL y en gran medida NO CONECTADA (código muerto)**. Hay dos mecanismos de tenant paralelos, inconsistentes entre sí, y el aislamiento efectivo de datos es **prácticamente nulo**: la mayoría de endpoints devuelven datos de todos los comercios. El estado real es **PARCIAL / andamiaje inacabado**, no "de cero" ni "completo".

---

## 1. ¿Existe noción de cliente/organización/comercio?

**SÍ, pero difusa.** El "tenant" es simplemente un identificador numérico (`Long tenantId`) que vive como columna en varias entidades. Hallazgos concretos:

- **No existe entidad `Tenant` ni tabla `tbl_tenants`.** No hay clase Java `Tenant` ni migración que cree `tbl_tenants`. La migración V1 deja los `FOREIGN KEY` hacia `tbl_tenants` **comentados** — ver `…/resources/db/migration/V1__Add_tenant_multi_tenancy_support.sql:63-76` ("this migration assumes tbl_tenants table exists; if not, add after tenant table creation").
- El `tenantId` se origina en **`User.tenantId`** (`…/retailapi/auth/model/User.java:46-47`, comentario "Reference to tenant (for multi-tenancy)"). Es decir, cada usuario pertenece a un tenant numérico.
- **`Company` y `Branch` NO son el tenant.** Los modelos `party/branch/model/Company.java` y `Branch.java` **no tienen columna `tenant_id`** mapeada (verificado: `grep tenant` sobre ambos no arroja resultados). Sin embargo, el script de onboarding **sí** inserta `tenant_id` en `tbl_companies` y `tbl_branches` (`…/resources/tenant-onboarding/init-tenant-schema.sql:41-49` y `54-61`). → **Mismatch esquema/entidad**: el onboarding escribe columnas que la entidad JPA no conoce.
- El onboarding (`…/retailapi/shared/tenancy/TenantOnboardingService.java:133-165`) verifica contra `tbl_companies`, `tbl_branches`, `tbl_locations` y `tbl_tenant_settings`. No se encontró migración que cree `tbl_locations` ni `tbl_tenant_settings` → el onboarding es **aspiracional/parcialmente cableado**.

**Respuesta:** el "tenant" aquí es un `Long` referenciado desde `User` (y estampado en algunas entidades operativas). No es `Company`; no hay tabla propia de tenant.

---

## 2. Estado real de la implementación de tenancy

### 2.1. Resolución del tenant en runtime — DOS mecanismos inconsistentes

**Mecanismo A — JWT → ThreadLocal (para auditoría, NO para filtrado):**
- `JwtService` incluye el claim `tenantId` en el token a partir de `user.getTenantId()`; si es null pone `""` (`…/retailapi/auth/security/jwt/JwtService.java:46-50`).
- `JwtFilter` extrae el claim y puebla `TenantContext` (ThreadLocal) por request (`…/retailapi/auth/security/jwt/JwtFilter.java:84-88`).
- `TenantFilter` solo **valida que el contexto esté seteado** en endpoints protegidos; no filtra queries (`…/retailapi/shared/security/TenantFilter.java:64-78`).
- `TenantContext` es un ThreadLocal clásico, limpiado en `finally` del `JwtFilter` (`…/retailapi/shared/security/TenantContext.java`; limpieza en `JwtFilter.java:107`).

**Mecanismo B — Header HTTP `X-Tenant-ID` (el que realmente usan los servicios operativos):**
- Los controladores operativos reciben el tenant como **cabecera provista por el cliente**, no desde el JWT:
  - `…/retailapi/operation/quote/controller/QuoteController.java:34` → `@RequestHeader("X-Tenant-ID") Long tenantId`.
  - Igual en `operation/invoice/controller/SalesInvoiceController.java`, `PurchaseInvoiceController.java`, `inventory/controller/InventoryController.java`.
- El frontend ERP (`frontend/web-client/src/app/core/services/sales-invoice.service.ts:65-116`) envía ese header derivándolo del propio JWT (`auth.service.ts:442,460-467`).

**El problema crítico:** el `tenantId` del header **nunca se contrasta** con el `tenantId` del JWT/`TenantContext`. No existe código que compare ambos. → Un cliente puede enviar cualquier valor en `X-Tenant-ID`.

### 2.2. ¿Filtrado automático o manual? → **MANUAL y, de hecho, INEXISTENTE en la práctica**

- **No hay filtrado automático de Hibernate.** No existe `@TenantId`, `@Filter`, `@FilterDef` ni discriminador en ninguna entidad (verificado por grep en todo el módulo: 0 resultados).
- Existe una infraestructura de filtrado **opt-in manual**: `TenantAwareRepository.currentTenant()` / `withCurrentTenant(spec)` (`…/retailapi/shared/persistence/TenantAwareRepository.java:40-56`), apoyada en `TenantAwareSpecifications.byTenant()` (`…/shared/persistence/TenantAwareSpecifications.java:36-46`).
- **HALLAZGO GRAVE: `currentTenant()` y `withCurrentTenant()` se invocan CERO veces en todo el código** (grep en todo el módulo, excluyendo su propia definición: 0 usos). Es **código muerto**.
- 33 de 37 repositorios extienden `TenantAwareRepository`, pero eso **no** aporta aislamiento: los métodos heredados de `JpaRepository` (`findAll()`, `findById()`, derived queries) **no** filtran por tenant. El comentario "automatic tenant filtering" (p. ej. `SalesInvoiceRepository.java:16`) es **falso**.
- `TenantContext.getTenantId()` solo se usa para **estampar** en auditoría/versionado y logging, nunca para filtrar: `…/retailapi/shared/audit/AuditService.java:212,229,244,258,277`, `…/shared/audit/DocumentVersioningService.java:58,137,171,186,201,223`, `…/operation/invoice/controller/FiscalComplianceController.java:64`.

### 2.3. Entidades con `tenant_id` vs sin él

**Entidades con campo `tenantId` mapeado (13):**

| Entidad | Cita |
|---|---|
| `User` | `auth/model/User.java:46-47` |
| `Product` | `catalog/product/model/Product.java:97-98` (`nullable = true`) |
| `Brand` | `catalog/brand/model/Brand.java` |
| `Category` | `catalog/category/model/Category.java` |
| `Stock` | `inventory/model/Stock.java` |
| `InventorySession` | `inventory/model/InventorySession.java` |
| `Customer` | `party/customer/model/Customer.java` |
| `Supplier` | `party/supplier/model/Supplier.java` |
| `Invoice` | `operation/invoice/model/Invoice.java` |
| `SalesInvoice` | `operation/invoice/model/SalesInvoice.java` |
| `PurchaseInvoice` | `operation/invoice/model/PurchaseInvoice.java` |
| `Sale` | `operation/sales/model/Sale.java:72-73` |
| `Quote` | `operation/quote/model/Quote.java` |

**Entidades SIN `tenant_id` (fuga estructural garantizada si se accede por sus repos):** `SaleItem`, `QuoteItem`, `InvoiceItem`, `SalesInvoiceItem`, `PurchaseInvoiceItem`, `OtherConcept`, `SupplierPayment`, `CashSession`, `CashMovement`, `StockMovement`, `InventoryItem`, `Price`, `ProductPrice`, `ProductPriceHistory`, `ProductPriceLink`, `SupplierPriceItem`, **`Company`**, **`Branch`**, `StockLocation`, y los tokens de `auth`.

**Migración V1 (NOT NULL + índices) cubre solo 9 tablas:** `tbl_users`, `tbl_products`, `tbl_brands`, `tbl_categories`, `tbl_stocks`, `tbl_customers`, `tbl_suppliers`, `tbl_invoices`, `tbl_sales` (`V1__Add_tenant_multi_tenancy_support.sql:11-35`).

**Inconsistencias detectadas:**
- La entidad marca `tenant_id` como **`nullable = true`** (`Product.java:97`, `Sale.java:72`), pero V1 impone **NOT NULL** en BD → contradicción.
- `Quote`, `SalesInvoice`, `PurchaseInvoice`, `InventorySession` tienen campo `tenantId` pero **no** están en la migración V1 (no se garantiza la columna/índice).
- Solo 9 servicios/mappers setean `tenantId` al crear: `QuoteServiceImpl.java:38`, `SalesInvoiceServiceImpl.java:38`, `PurchaseInvoiceServiceImpl.java:39`, `InventoryService.java:42`, más mappers de quote/invoice y auditoría. **`Product`, `Customer`, `Supplier`, `Brand`, `Category`, `Stock`, `Sale` y `User`** (en flujos normales) **no reciben `tenantId` al crearse** → se insertarían con `tenant_id = NULL` (violando la NOT NULL de V1 si la migración estuviese aplicada; señal de que V1 no se está aplicando o los datos quedan sin tenant).

---

## 3. Gaps de AISLAMIENTO (fuga de datos entre comercios) — lo más crítico

### GAP-1 — Servicios "tenant-aware" que IGNORAN el `tenantId` recibido (fuga de facturas)
`SalesInvoiceServiceImpl` recibe `tenantId` pero **nunca lo aplica**:
- `getById(UUID id, Long tenantId)` → `salesInvoiceRepository.findById(id)` sin filtro de tenant (`operation/invoice/service/SalesInvoiceServiceImpl.java:60-64`). Cualquier tenant puede leer una factura de otro conociendo el UUID.
- `getAll(Long tenantId)` → `salesInvoiceRepository.findAll()` devuelve **TODAS las facturas de todos los tenants** (`SalesInvoiceServiceImpl.java:69-74`).
- `getByCustomerId(...)` → `findByCustomerId(customerId)` sin tenant (`:78-83`). Igual patrón en `update`, `recordPayment`, `cancel`, `delete` (todos usan `findById(id)` — líneas 120, 148, 166, 181).
- Mismo patrón esperado en `PurchaseInvoiceServiceImpl` (recibe `tenantId`, repos sin filtro).

### GAP-2 — Dominios COMPLETOS sin ninguna noción de tenant (catálogo, clientes, proveedores, ventas, precios, caja)
Solo **4** controladores referencian tenant (`QuoteController`, `SalesInvoiceController`, `PurchaseInvoiceController`, `InventoryController`). **Todos los demás no tienen ninguna referencia a tenant**, y sus servicios/repos tampoco filtran:
- `catalog/product/controller/ProductController.java` (y `ProductServiceImpl` — grep `tenant` en `catalog/product/service/`: 0). El catálogo entero es **global**.
  - Ejemplo de query cruzada: `ProductRepository.findByIdIncludingDeleted` es SQL nativo `SELECT * FROM tbl_products WHERE id = :id` sin `tenant_id` (`catalog/product/repository/ProductRepository.java:18-19`); igual `existsDeletedById:22-29`, `restoreById:32-34`, `forceDelete:55-57`, `countWithFilters:76-83`.
- `party/customer/controller/CustomerController.java` → clientes globales entre comercios.
- `party/supplier/controller/SupplierController.java` → proveedores globales.
- `operation/sales/controller/SaleController.java` → `Sale` tiene campo `tenantId` (`Sale.java:72`) pero el controlador/servicio **no lo setea ni filtra** → ventas mezcladas y creadas con tenant NULL.
- También sin tenant: `catalog/pricing/controller/PricingController.java` (precios), `catalog/brand/...`, `catalog/category/...`, `operation/cash/controller/CashController.java` (caja), `party/branch/controller/CompanyController.java` y `BranchController.java`.
- Lista completa de controladores sin tenant verificada por grep (26 de 30 controladores).

**Impacto:** stock, catálogo, precios, clientes, proveedores, ventas y caja son **compartidos globalmente** entre todos los comercios. Fuga total en estos dominios.

### GAP-3 — `X-Tenant-ID` de confianza ciega (spoofing de tenant)
El tenant efectivo en los flujos operativos proviene de una **cabecera controlada por el cliente** (`QuoteController.java:34`, controladores de invoice/inventory) y **no se valida** contra el claim del JWT que `JwtFilter` colocó en `TenantContext` (`JwtFilter.java:84-88`). No existe punto de comparación. → Un usuario autenticado puede enviar `X-Tenant-ID` de otro comercio. (En los pocos servicios que sí usan el valor —p. ej. al crear con `setTenantId`— esto permite **escribir en el tenant ajeno**; en los que lo ignoran, el header es irrelevante pero da falsa sensación de aislamiento.)

**Nota transversal:** el aislamiento previsto (Specifications `currentTenant()`) existe pero está **sin invocar en ninguna parte** (código muerto), por lo que ninguno de los repos "tenant-aware" filtra realmente.

---

## 4. Impacto en el PORTAL ecommerce

**Modelo actual: un solo dominio con SELECTOR de tienda, y totalmente MOCK (sin backend).**

- El portal (`frontend/ecommerce`) resuelve el "tenant" en el cliente vía `localStorage` con clave `rm_tenant`, por defecto `'thomann-demo'` (`frontend/ecommerce/src/app/core/services/tenant.service.ts:7,13-16`).
- Los tenants son **datos mock hardcodeados**: 3 tiendas demo (`Thomann Demo`, `Rockhouse Music`, `MusicPro Store`) en `frontend/ecommerce/src/app/core/data/mock-data.ts:3-7`.
- El cambio de tienda es un **dropdown en el topbar** (`shared/components/topbar/topbar.component.ts:138`) que solo aplica un color de marca como variable CSS (`tenant.service.ts:24-25`). No hay subdominio, no hay ruteo por host.
- El portal ecommerce **no realiza llamadas reales al backend**: no se encontró uso de `HttpClient`/`fetch`/`/api/` en `frontend/ecommerce/src/app` (solo `app.config.ts` registra el provider). Todo el catálogo/tiendas es mock.

**PREGUNTA ABIERTA (no determinada):** el modelo objetivo (subdominio por comercio vs. dominio único con selector) **no está definido en código** de forma concluyente. El backend **no resuelve tenant para peticiones públicas del portal**: no hay endpoints públicos de catálogo por tenant ni resolución por host/subdominio; el catálogo backend es global y sin scope de tenant (ver GAP-2). Debe decidirse explícitamente antes de implementar el portal real.

---

## 5. Datos/config hardcodeados que asumen "un solo comercio"

- **Portal ecommerce:** identidad de tienda hardcodeada en mock (`mock-data.ts:3-7`), fallback fijo a `'thomann-demo'` (`tenant.service.ts:14-15`). Categorías y productos hardcodeados (`mock-data.ts:9+`).
- **Onboarding backend:** valores placeholder de comercio único — CUIT fijo `'00000000000'` y sucursal `'Main Branch'` (`…/resources/tenant-onboarding/init-tenant-schema.sql:45,57`).
- **Config fiscal / branding en ERP web-client:** revisar `frontend/web-client/src/environments/environment.ts` y `environment.prod.ts` (existen; contenido no auditado en detalle en esta pasada — **no determinado** si contienen razón social/logo/config fiscal fija).
- **Company como identidad fiscal:** `Company` (CUIT único global, `party/branch/model/Company.java:29-32`) es `unique` a nivel global, no por tenant → si dos comercios comparten CUIT o se onboardan, hay colisión potencial. (Y `Company` no tiene `tenant_id` mapeado en la entidad.)

---

## Resumen de cobertura por dominio

| Dominio | Campo `tenant_id` | ¿Servicio setea al crear? | ¿Filtra al leer? | Aislamiento real |
|---|---|---|---|---|
| Auth/User | Sí | (login por email, cross-tenant intencional) | No | Nulo |
| Producto/Catálogo | Sí (`nullable`) | No | No | **Nulo (global)** |
| Marca/Categoría | Sí | No | No | Nulo (global) |
| Stock/Inventario | Sí | Solo `InventorySession` | No | Nulo |
| Cliente/Proveedor | Sí | No | No | **Nulo (global)** |
| Venta (`Sale`) | Sí | No | No | Nulo |
| Quote | Sí | Sí (`:38`) | No (repo sin filtro) | Parcial (solo estampa) |
| SalesInvoice/PurchaseInvoice | Sí | Sí | **No (ignora `tenantId`)** | **Nulo (fuga por UUID)** |
| Precios/Caja/Company/Branch | No | — | No | Nulo (global) |

**Veredicto:** tenancy **PARCIAL / andamiaje**. Infraestructura presente (contexto, filtro, specifications, migración, onboarding) pero **no integrada**: filtrado automático inexistente, helpers de filtrado sin invocar, header de tenant sin validar, y 4/30 controladores con tenant. El aislamiento efectivo de datos es **prácticamente nulo**.
