# FASE 6 — Auditoría de Testing (Gap de Cobertura)

> Tarea de solo lectura. Verificado leyendo código real. No se ejecutaron tests ni builds.
> Todas las citas usan rutas y líneas del repositorio en el estado auditado (rama `mono`).

---

## 1. Estado real de tests

### 1.1 Veredicto sobre la premisa "no hay tests"

**REFUTADA parcialmente.** La suposición de "ausencia de tests" es **falsa para el backend** y **prácticamente cierta para el frontend**.

- El backend (`retail-api`) tiene una suite **real y sustancial** de tests unitarios y de integración: **7 archivos de test de negocio con ~176 métodos `@Test`**, más 4 tests triviales de arranque de contexto Spring.
- El frontend tiene únicamente **2 archivos `*.spec.ts`**, ambos scaffolds triviales (no prueban lógica de negocio).
- **No existe CI** que ejecute ninguna de estas suites.

Conclusión: hay una base de tests de backend enfocada en dominios fiscales/facturación/inventario, pero está **desconectada de cualquier pipeline**, y el frontend está esencialmente **sin cobertura**.

---

### 1.2 Inventario Backend — `retail-api`

Ruta base: `backend/erphub-api/microservices/retail-api/src/test/java/com/zaphirio/retailapi/`

| Archivo | Líneas | `@Test` | Estilo | Clase bajo prueba | ¿Ejecutable sin DB? |
|---|---:|---:|---|---|---|
| `shared/fiscal/InvoiceImmutabilityServiceTest.java` | 359 | 36 | Unit puro (`new`) | `InvoiceImmutabilityService` | Sí |
| `shared/fiscal/TaxComplianceServiceTest.java` | 434 | 36 | Unit puro (`new`) | `TaxComplianceService` | Sí |
| `inventory/service/InventoryServiceTest.java` | 754 | 31 | Mockito (`@InjectMocks`) | `InventoryService` | Sí |
| `operation/quote/service/QuoteServiceTest.java` | 869 | 39 | Mockito (`@InjectMocks`) | `QuoteServiceImpl` | Sí |
| `operation/invoice/service/PurchaseInvoiceServiceTest.java` | 628 | 15 | Mockito (`@InjectMocks`) | `PurchaseInvoiceServiceImpl` | Sí |
| `operation/invoice/service/SalesInvoiceServiceTest.java` | 561 | 13 | Mockito (`@InjectMocks`) | `SalesInvoiceServiceImpl` | Sí |
| `shared/tenancy/TenantIsolationTest.java` | 298 | 6 | `@SpringBootTest` integración | `UserRepository`, `ProductRepository` (multitenant) | **No — requiere PostgreSQL** |
| `RetailApiApplicationTests.java` | 13 | 1 | Context load (scaffold) | — | Requiere contexto/DB |

Otros microservicios (solo scaffolds `contextLoads()` generados, sin valor de negocio):
- `api-gateway/.../ApiGatewayApplicationTests.java`
- `service-registry/.../ServiceRegistryApplicationTests.java`
- `config-server/.../ConfigServerApplicationTests.java`

**Total backend: 11 archivos de test** (7 de negocio + 4 triviales de arranque).

Evidencias del tipo de prueba:
- Tests fiscales instancian el servicio directamente sin Spring ni mocks:
  `InvoiceImmutabilityServiceTest.java:24` → `invoiceImmutabilityService = new InvoiceImmutabilityService();`
  `TaxComplianceServiceTest.java:31` → `taxComplianceService = new TaxComplianceService();`
- Tests de servicio usan Mockito con repos/mappers simulados:
  `SalesInvoiceServiceTest.java:39-52` (`@ExtendWith(MockitoExtension.class)`, `@Mock` repos, `@InjectMocks SalesInvoiceServiceImpl`).
- Test de aislamiento multitenant es integración con base real:
  `TenantIsolationTest.java:40-41` (`@SpringBootTest`, `@ActiveProfiles("test")`).

**Cobertura por área (aproximada, por presencia de suite):**

| Área de dominio | Servicio principal | ¿Tiene test? |
|---|---|---|
| Facturación venta | `operation/invoice/service/SalesInvoiceServiceImpl` | Sí (13) |
| Facturación compra | `operation/invoice/service/PurchaseInvoiceServiceImpl` | Sí (15) |
| Inmutabilidad fiscal | `shared/fiscal/InvoiceImmutabilityService` | Sí (36) |
| Cumplimiento fiscal/IVA | `shared/fiscal/TaxComplianceService` | Sí (36) |
| Inventario | `inventory/service/InventoryService` | Sí (31) |
| Presupuestos/Quotes | `operation/quote/service/QuoteServiceImpl` | Sí (39) |
| Aislamiento multitenant | `shared/tenancy` (repos) | Sí (6, integración) |
| **Venta / Punto de venta** | `operation/sales/service/SaleServiceImpl` | **No** |
| **Caja / TPV** | `operation/cash/service/CashServiceImpl` | **No** |
| **Autenticación / Login** | `auth/service/AuthServiceImpl` | **No** |
| **Pricing** | `catalog/pricing/service/PricingServiceImpl` | **No** |
| **Catálogo de proveedor** | `catalog/supplierCatalog/service/PriceItemServiceImpl` | **No** |
| **Stock (movimientos)** | `inventory/service/StockServiceImpl` | **No** (distinto de `InventoryService`) |

---

### 1.3 Configuración de test (Backend)

- **Dependencia de test:** `spring-boot-starter-test` con `<scope>test</scope>`
  (`backend/erphub-api/microservices/retail-api/pom.xml:212-215`). Este starter aporta JUnit 5 (Jupiter), Mockito y AssertJ, todos usados en las suites (imports en `SalesInvoiceServiceTest.java:9-25`, `TenantIsolationTest.java:24` usa AssertJ).
- **Perfil de test:** `src/test/resources/application-test.yaml`
  - Usa **PostgreSQL real** en `jdbc:postgresql://localhost:5432/retail_api_test` (`application-test.yaml:12-16`).
  - `ddl-auto: create-drop` (`application-test.yaml:6`), Flyway deshabilitado (`:19-20`).
  - **Implicación crítica:** los tests `@SpringBootTest` (`TenantIsolationTest`, `RetailApiApplicationTests`) **no pueden ejecutarse sin una instancia PostgreSQL levantada**. No hay Testcontainers ni H2 en dependencias detectadas. Los tests Mockito y los unit-puros fiscales **sí** son ejecutables aislados.
- **No determinado:** presencia/config de JaCoCo o Surefire personalizado en el parent pom (`microservices/pom.xml` menciona en comentario "jacoco, sonar" en la línea 19 de `retail-api/pom.xml` pero no se confirmó bloque de plugin activo; no verificado en profundidad).

### 1.4 Configuración de test (Frontend)

**`frontend/web-client`** (Angular, runner Karma/Jasmine):
- Script: `"test": "ng test"` (`frontend/web-client/package.json:11`).
- Builder: `@angular/build:karma` (`frontend/web-client/angular.json:89-90`).
- Toolchain: `jasmine-core ~6.2.0`, `karma ~6.4.4`, `karma-coverage`, `karma-jasmine`, `@types/jasmine ~6.0.0` (`package.json:51-60`).
- **Único spec:** `src/app/smoke.spec.ts` → prueba trivial `expect(true).toBeTrue()`. Sin valor de negocio.

**`frontend/ecommerce`** (Angular 21, runner Vitest):
- Script: `"test": "ng test"` (`frontend/ecommerce/package.json:9`).
- Toolchain: `vitest ^4.0.8`, `jsdom ^28.0.0` (`package.json:27,30`). Framework Angular `^21.2.0` (no es un stack React/Next; es Angular con el runner experimental Vitest).
- **Único spec:** `src/app/app.spec.ts` → scaffold generado: "should create the app" y comprueba título "Hello, ecommerce". Sin valor de negocio.
- **No determinado:** no se encontró `vitest.config.*` ni `vite.config.*` explícito en la raíz del proyecto ecommerce; probablemente la config va vía `@angular/build`.

**`frontend/erp-structure`:** no contiene archivos `*.spec.ts` ni `*.test.ts` (no aparece en la búsqueda).

### 1.5 CI

**No existe integración continua que ejecute tests.**
- No hay directorio `.github/workflows/`. Lo que hay bajo `.github/` son únicamente hooks locales de una herramienta de "java-upgrade"/"modernize" (`.github/java-upgrade/hooks/scripts/recordToolUse.sh`, etc.), **no** workflows de GitHub Actions.
- Ningún YAML de workflow encontrado en el repositorio.
- Conclusión: las suites existentes **nunca se ejecutan automáticamente**; su ejecución depende de que un desarrollador corra `mvn test` / `ng test` manualmente (y para los `@SpringBootTest`, con Postgres levantado).

---

### 1.6 Verificación del commit de tests de facturación

**CONFIRMADO — el commit existe y es real.**
- `ca838778` — "Add comprehensive unit tests for SalesInvoice and PurchaseInvoice services" (autor crishof, 2026-06-01).
- Añade exactamente 2 archivos, **1189 líneas**:
  - `SalesInvoiceServiceTest.java` (561 líneas, 13 tests) — creación de factura con ítems, recuperación (por ID/cliente/rango de fechas), actualización, **registro y seguimiento de pagos**, cancelación, cálculo de totales y estado de pago (ver docstring `SalesInvoiceServiceTest.java:27-37`).
  - `PurchaseInvoiceServiceTest.java` (628 líneas, 15 tests).
- Ambos archivos están versionados (`git ls-files` los lista). Commits relacionados previos confirman una campaña de testing: `c300922a` (Inventory, 31 tests), `80e7c512` (Quote, 39 tests), `ba98eae4` (fiscal compliance suite).

---

## 2. Flujos críticos de negocio a priorizar (riesgo × ausencia de cobertura)

Priorización: **riesgo de negocio/fiscal/legal × cobertura actual inexistente o débil**. Los flujos ya cubiertos (facturación, inmutabilidad fiscal, IVA, quotes, inventario base) bajan de prioridad; los de mayor riesgo **sin ningún test** suben.

### P1 — Venta / creación de pedido desde backoffice (operation/sales)
- **Por qué:** núcleo transaccional del ERP; genera dinero, descuenta stock y alimenta la facturación. **Cero cobertura.**
- **Toca:** `operation/sales/service/SaleServiceImpl.java`, `operation/sales/controller/SaleController.java`. Interacción con inventario/stock y con facturación (`SalesInvoiceServiceImpl`).
- **Riesgo:** Alto. Cálculo de importes, descuentos, decremento de stock, transición a factura.

### P2 — Caja / TPV (operation/cash)
- **Por qué:** manejo de efectivo, apertura/cierre de caja y arqueo; errores aquí son descuadres monetarios directos. **Cero cobertura.**
- **Toca:** `operation/cash/service/CashServiceImpl.java`.
- **Riesgo:** Alto. Integridad de saldos, concurrencia de operaciones sobre la misma caja.

### P3 — Login / autenticación de ambos tipos de usuario (auth)
- **Por qué:** puerta de entrada; fallos = brechas de seguridad o bloqueo total. **Cero cobertura.**
- **Toca:** `auth/service/AuthServiceImpl.java`, `auth/controller/AuthController.java`, `RegistrationController.java`, `PasswordRecoveryController.java`, `auth/security/`.
- **Riesgo:** Alto. Emisión/validación de tokens, roles, recuperación de contraseña, invitaciones de admin.

### P4 — Aislamiento multitenant end-to-end (shared/tenancy)
- **Por qué:** un tenant que vea datos de otro es un incidente crítico de privacidad/legal. **Existe test (`TenantIsolationTest`, 6 tests) pero requiere PostgreSQL y no corre en CI → cobertura efectiva frágil.**
- **Toca:** `shared/tenancy/`, `shared/security/TenantContext.java`, `TenantAwareRepository`, filtrado por `tenant_id`.
- **Riesgo:** Muy alto por impacto, mitigado parcialmente por test existente. Prioridad = hacerlo ejecutable/CI y extenderlo a más repositorios (sales, invoice, cash).

### P5 — Importación de catálogo de proveedor (catalog/supplierCatalog)
- **Por qué:** ingesta masiva de precios/artículos; errores propagan precios erróneos a toda la venta. **Cero cobertura.**
- **Toca:** `catalog/supplierCatalog/service/PriceItemServiceImpl.java`.
- **Riesgo:** Medio-Alto. Parsing/mapeo, deduplicación, actualización de precios.

### P6 — Pricing (catalog/pricing)
- **Por qué:** determina el precio de venta final; feed directo de P1/P2. **Cero cobertura.**
- **Toca:** `catalog/pricing/service/PricingServiceImpl.java`.
- **Riesgo:** Medio-Alto. Márgenes, redondeos, impuestos aplicados sobre el precio.

### P7 — Movimientos de stock (inventory/StockService)
- **Por qué:** `InventoryServiceTest` cubre `InventoryService` (31 tests) pero **`StockServiceImpl` — el que registra entradas/salidas de stock — no tiene test.** Descuadres de stock afectan venta y compra.
- **Toca:** `inventory/service/StockServiceImpl.java` (distinto de `InventoryService` ya testeado).
- **Riesgo:** Medio-Alto. Concurrencia, stock negativo, reservas.

### P8 — Facturación e inmutabilidad fiscal (regresión / CI)
- **Por qué:** **Ya bien cubierto** (`SalesInvoiceServiceTest` 13, `PurchaseInvoiceServiceTest` 15, `InvoiceImmutabilityServiceTest` 36, `TaxComplianceServiceTest` 36). El gap no es escribir tests, sino **garantizar que se ejecuten en CI** para que la inmutabilidad fiscal no se rompa en refactors.
- **Toca:** `shared/fiscal/*`, `operation/invoice/service/*`.
- **Riesgo:** Bajo hoy (cubierto), Alto si se rompe sin CI.

### P9 — Checkout completo del portal ecommerce (frontend/ecommerce)
- **Por qué:** flujo de compra del cliente final; **sin ningún test real** (solo scaffold `app.spec.ts`).
- **Toca:** componentes/servicios de `frontend/ecommerce/src/app/` (carrito, checkout, pago). Vitest ya configurado.
- **Riesgo:** Medio-Alto (cara al cliente), pero se prioriza tras el backend por dependencia de la lógica servidor.

### P10 — Flujos backoffice del web-client (frontend/web-client)
- **Por qué:** UI de gestión (facturas, quotes, inventario) **sin tests reales** (solo `smoke.spec.ts` trivial). Karma/Jasmine ya configurado.
- **Toca:** componentes de listado/edición en `frontend/web-client/src/app/`.
- **Riesgo:** Medio. Prioridad baja frente a la lógica de negocio del backend.

---

## Resumen de acciones recomendadas (fuera de alcance de esta auditoría, informativo)

1. **Crear CI** (`.github/workflows/`) que ejecute `mvn test` y `ng test` — hoy inexistente; es el mayor multiplicador de valor sobre los tests ya escritos.
2. **Desacoplar los `@SpringBootTest` de un Postgres local** (Testcontainers o H2 perfil test) para que `TenantIsolationTest` sea ejecutable en CI.
3. **Cubrir P1–P3** (venta, caja, login) — mayor riesgo con cero cobertura.
