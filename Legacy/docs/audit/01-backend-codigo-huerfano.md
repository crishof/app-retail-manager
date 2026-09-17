# Auditoría Backend — Fase 1: Código huérfano, endpoints muertos y deuda estructural

**Ámbito:** `backend/erphub-api/microservices/retail-api` (Java 25 / Spring Boot 4, paquete `com.zaphirio.retailapi`).
**Metodología:** verificación directa sobre el código (lectura + grep de invocaciones). No se confía en `.md` previos. Cada hallazgo cita `ruta:línea` relativa a la raíz del repo.
**Rutas base abreviadas:** `R = backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi`.

**Inventario real verificado:** 31 controladores REST + 1 `@ControllerAdvice`; 49 clases `@Service`; 37 ficheros `*Repository`; 41 `@Entity`; 4 migraciones Flyway (V1–V4). Sin `@Scheduled`, sin `@EventListener`. Un único listener AMQP (`@RabbitListener`) y un único `@Async`.

**Hallazgo transversal decisivo:** el frontend **ecommerce (portal) NO consume la API**. Es 100 % datos mock: `frontend/ecommerce/src/app/core/services/product.service.ts:3` importa `PRODUCTS` de `../data/mock-data`; `tenant.service.ts`, `cart.service.ts` y `favorites.service.ts` no usan `HttpClient`. Registra `provideHttpClient` en `frontend/ecommerce/src/app/app.config.ts:11` pero no existe ninguna llamada HTTP (`grep http.get/post/... = 0`). Por tanto, el único consumidor real del backend es **web-client (backoffice)**.

---

## 1. Métodos huérfanos

Clasificación: **SEGURO** (sin ninguna vía de invocación), **SOSPECHOSO** (sólo alcanzable por una cadena que a su vez está muerta, o API definida y nunca llamada), **FALSO POSITIVO** (uso por Spring Data / reflexión / Lombok / enum).

### 1.1 Clase completamente huérfana

| Elemento | Ubicación | Clasificación | Evidencia |
|---|---|---|---|
| `TenantOnboardingService` (clase entera) | `R/shared/tenancy/TenantOnboardingService.java:25` | **SEGURO** | La clase no se inyecta en ningún sitio: `grep TenantOnboardingService` sólo aparece en su propio fichero. Ningún controlador ni `RegistrationController`/`AuthServiceImpl` la invocan. |
| `initializeTenantSchema(...)` | `…/TenantOnboardingService.java:47` | **SEGURO** | Sin invocaciones. Carga un recurso `/tenant-onboarding/init-tenant-schema.sql` que tampoco se ejecuta. |
| `verifyTenantInitialization(...)` | `…/TenantOnboardingService.java:133` | **SEGURO** | Sin invocaciones. |

### 1.2 Método de fallback zombie (resiliencia eliminada)

| Elemento | Ubicación | Clasificación | Evidencia |
|---|---|---|---|
| `BaseService.getSupplierStatusFallback(Throwable)` | `R/catalog/brand/service/BaseService.java:21` | **SEGURO** | El propio comentario de la línea 15 dice "Removed @CircuitBreaker - no longer needed with direct service injection". Ya no hay `@CircuitBreaker`/`fallbackMethod` que lo referencie; método muerto. |

### 1.3 Subsistema fiscal/auditoría/versionado — API pública definida y nunca invocada

Todo este bloque sólo es alcanzable a través de `FiscalComplianceController` (`/api/v1/compliance/**`), que **ningún frontend consume** (ver §3). Además, el flujo real de facturación (`SalesInvoiceServiceImpl`, `InvoiceServiceImpl`) **no invoca** auditoría ni versionado (`grep audit/Finaliz/versioning` en esos servicios = 0). `AuditService` sólo se inyecta en la cadena muerta (`FiscalComplianceController` e `InvoiceFinalizationService`).

Métodos con **cero invocaciones reales** (verificado con `grep '\.<metodo>('`):

| Método | Ubicación | Clasificación |
|---|---|---|
| `AuditService.logAction` | `R/shared/audit/AuditService.java:187` | **SOSPECHOSO** |
| `AuditService.logUpdate` | `…/AuditService.java:77` | **SOSPECHOSO** |
| `AuditService.logDelete` | `…/AuditService.java:105` | **SOSPECHOSO** |
| `AuditService.logFinalization` | `…/AuditService.java:132` | **SOSPECHOSO** |
| `AuditService.logCancellation` | `…/AuditService.java:158` | **SOSPECHOSO** |
| `AuditService.getEntityHistory` | `…/AuditService.java:211` | **SOSPECHOSO** |
| `AuditService.getEntityTypeHistory` | `…/AuditService.java:243` | **SOSPECHOSO** |
| `AuditService.getUserActivity` | `…/AuditService.java:228` | **SOSPECHOSO** |
| `AuditService.getFinalizedDocumentAuditTrail` | `…/AuditService.java:257` | **SOSPECHOSO** |
| `DocumentVersioningService.getVersionHistory` | `R/shared/audit/DocumentVersioningService.java:170` | **SOSPECHOSO** |
| `DocumentVersioningService.getCurrentVersion` | `…/DocumentVersioningService.java:185` | **SOSPECHOSO** |
| `DocumentVersioningService.getFinalizedVersion` | `…/DocumentVersioningService.java:200` | **SOSPECHOSO** |
| `DocumentVersioningService.getVersion` | `…/DocumentVersioningService.java:218` | **SOSPECHOSO** |
| `DocumentVersioningService.verifyVersionIntegrity` | `…/DocumentVersioningService.java:239` | **SOSPECHOSO** |
| `InvoiceImmutabilityService.validateFieldModification` | `R/shared/fiscal/InvoiceImmutabilityService.java:106` | **SOSPECHOSO** |
| `TaxComplianceService.requiresWithholding` | `R/shared/fiscal/TaxComplianceService.java:193` | **SOSPECHOSO** |

Nota: dentro de esa misma cadena SÍ se usan `AuditService.logCreate` (`:49`), `DocumentVersioningService.createVersion` (`:51`) y `finalizeDocument` (`:131`) — llamados desde `InvoiceFinalizationService`. Es decir, `AuditService` expone métodos específicos por tipo de evento (`logUpdate`, `logDelete`, `logFinalization`, `logCancellation`) pero el código sólo usa el genérico `logCreate` para todo (incluida la cancelación en `InvoiceFinalizationService.java:184-207`): API divergente y en su mayoría muerta.

### 1.4 Helpers de enum / excepción definidos y no usados

Verificado sin invocaciones directas; se marcan **SOSPECHOSO** salvo los getters de excepción (Lombok/serialización → **FALSO POSITIVO**):

| Método | Ubicación | Clasificación |
|---|---|---|
| `InvoiceDocumentType.affectsStock` / `getSpanishName` / `isApplicableToPurchase` / `requiresSequentialNumbering` | `R/shared/fiscal/InvoiceDocumentType.java` | **SOSPECHOSO** |
| `InvoiceStatus.getDisplayName` / `isAwaitingPayment` / `isFinal` | `R/shared/fiscal/InvoiceStatus.java` | **SOSPECHOSO** |
| `InvoiceTaxRate.fromPercentage` / `getDecimalMultiplier` / `getGrossMultiplier` / `getDisplayRate` / `getPercentage` | `R/shared/fiscal/InvoiceTaxRate.java` | **SOSPECHOSO** |
| `TaxRegime.canClaimInputVAT` / `issuesTaxInvoices` | `R/shared/fiscal/TaxRegime.java` | **SOSPECHOSO** |
| `TaxComplianceException.getActualValue` / `getExpectedValue` | `R/shared/fiscal/TaxComplianceException.java` | **FALSO POSITIVO** (datos de la excepción) |

### 1.5 Falsos positivos relevantes (NO tocar)

- **Métodos de `*Repository`**: son interfaces Spring Data; su implementación es generada. No entran en el barrido de "método público sin invocar".
- **`OrderServiceClient` (`R/shared/client/OrderServiceClient.java`)**: sus 3 métodos (`hasOrdersForCustomer:17`, `replaceCustomer:28`, `hasOrdersForProduct:43`) SÍ se invocan (desde `CustomerServiceImpl`, `CustomerDeletionService`, `ProductServiceImpl`), pero **están vacíos**: todos son `// TODO: Implement … when Order service is available` y devuelven `false`/`new ReassignCustomerResponse(0)`. No es huérfano, es **stub permanente** (no existe módulo Order).

---

## 2. Entidades / tablas huérfanas

Contexto de esquema: en `dev` el esquema lo genera Hibernate (`application-dev.yml:28` `ddl-auto: update`); en `prod` `ddl-auto: validate` (`application-prod.yml:28`). Flyway sólo tiene V1–V4. `docker/postgres/init/01-create-databases.sql` **no crea tablas** (los `CREATE DATABASE` están comentados). Es decir, las tablas base (`tbl_products`, `tbl_brands`, `tbl_categories`, `tbl_stocks`, …) **no tienen ninguna migración `CREATE TABLE`**; V1 hace `ALTER TABLE … tbl_products …` asumiendo que ya existen. Ver §5 (deuda de esquema).

### 2.1 Entidades huérfanas (sin repo y sin uso)

| Entidad | Ubicación | Tabla | Clasificación | Evidencia |
|---|---|---|---|---|
| `ProductPrice` | `R/catalog/pricing/model/ProductPrice.java:22` | (sin `@Table` → `product_price`) | **SEGURO** | Sólo se referencia en su propio fichero. Coexiste con la entidad viva `Price` (`tbl_prices`, con `PriceRepository`). Modelo de precio muerto/legacy. |
| `BrandProjection` | `R/catalog/product/model/BrandProjection.java:13` | `brand_projection` | **SEGURO** | Sin repositorio. `ProductBrandProjectionService` (el que consume los eventos Rabbit) **no la usa**: actualiza vía `ProductRepository.updateBrandName/clearBrandFromProducts` (`ProductBrandProjectionService.java:21-23`). Read-model CQRS abandonado. Nomenclatura además inconsistente (sin prefijo `tbl_`). |

### 2.2 Entidades sin repositorio propio pero gestionadas por cascada (FALSO POSITIVO)

`SaleItem` (`R/operation/sales/model/SaleItem.java`), `StockLocation` (`R/party/branch/model/StockLocation.java`, `tbl_stock_location`), `InvoiceItem`, `OtherConcept` → hijas gestionadas por su agregado padre (`Sale`, `Branch`, `Invoice`). No requieren repo dedicado.

### 2.3 Tablas sin entidad (creadas por migración, sin mapeo JPA)

La migración V4 diseñó una jerarquía de facturas con **herencia JOINED** que el modelo de entidades **no implementa**:

| Tabla | Origen | Estado | Evidencia |
|---|---|---|---|
| `tbl_invoices` | `db/migration/V4__…Sales_Purchase_Separation.sql:13` | **HUÉRFANA** | Ninguna entidad la mapea (`grep 'tbl_invoices"' = 0`). El comentario de V4 dice "Uses JOINED inheritance: discriminator column + type-specific subtables", pero `SalesInvoice`→`tbl_sales_invoices`, `PurchaseInvoice`→`tbl_purchase_invoices` e `Invoice`→`tbl_supplier_invoice` son `@Table` independientes **sin** `@Inheritance`. |
| `tbl_invoice_document_types` | `V4__…:165` | **HUÉRFANA** | Tabla de catálogo sin entidad ni consulta. |

Consecuencia: **divergencia esquema↔código**. En `dev` (`update`) Hibernate crea tablas planas e ignora el diseño de V4; en `prod` (`validate`) la validación fallaría porque `tbl_invoices`/FKs de V4 no coinciden con el mapeo de entidades.

---

## 3. Controllers / endpoints muertos

Búsqueda de consumo cruzada en `frontend/web-client/src` (backoffice) y `frontend/ecommerce/src` (portal). El portal no llama a nada (mock). Endpoints backoffice detectados por literales `/api|/internal` en `web-client`: `/api/v1/{branches,brands,cash,categories,companies,customers,import-jobs,inventory,price-items,product-price-links,products,products/import/supplier,purchases,sales,suppliers}`, `/api/{inventory,quotes,sales-invoices,purchase-invoices}`, y `auth/*` (vía `environment.authUrl`).

| Controller | Ruta base | Estado | Evidencia de búsqueda |
|---|---|---|---|
| `FiscalComplianceController` | `/api/v1/compliance/**` | **MUERTO (SOSPECHOSO)** | `grep -r "compliance\|/finalize\|audit-trail" frontend/web-client/src = 0`. Sostiene todo el subsistema §1.3. Feature construida y no integrada. `R/operation/invoice/controller/FiscalComplianceController.java:35`. |
| `ProductStockController` | `/api/v1/products/stock/**` (`/from-invoice`, `/from-order`) | **MUERTO (SEGURO)** | `grep -r "products/stock\|from-order\|from-invoice" frontend/web-client/src = 0`. `/from-order` depende de un módulo Order inexistente. `R/catalog/product/controller/ProductStockController.java:16`. Arrastra `ProductStockServiceImpl` (§4). |
| `BrandInternalController` | `/internal/brands` | **MUERTO (SOSPECHOSO)** | `R/catalog/brand/controller/BrandInternalController.java:16`. Ver nota clientes ↓. |
| `CategoryInternalController` | `/internal/categories` | **MUERTO (SOSPECHOSO)** | `R/catalog/category/controller/CategoryInternalController.java:16`. |
| `ProductInternalController` | `/internal/products/**` | **MUERTO (SOSPECHOSO)** | `R/catalog/product/controller/ProductInternalController.java:19`. |
| `ImageInternalController` | `/internal/images/**` | **MUERTO (SOSPECHOSO)** | `R/media/image/controller/ImageInternalController.java:15`. |
| `PricingController` | `/internal/pricing/**` | **MUERTO (SOSPECHOSO)** | `R/catalog/pricing/controller/PricingController.java:19`. |

**Nota sobre los `/internal/*`:** las clases `R/shared/client/*ServiceClient` **no son clientes HTTP** — inyectan y llaman al servicio in-process (p. ej. `InventoryServiceClient` → `StockService`, `PricingServiceClient` → `PricingService`, `BrandServiceClient` → `BrandInternalService`). No hay `RestClient/RestTemplate/WebClient/Feign` en `shared/client` (`grep = 0`). Por tanto los controladores `/internal/*` **no tienen ningún llamante** (ni frontend ni cliente interno): son superficie HTTP muerta, resto de la era microservicios. Los *servicios* que envuelven sí se usan; los *endpoints* no.

**Duplicación de dominio Factura de compra:** conviven dos implementaciones vivas y ambas consumidas por el backoffice:
- Antigua: `Invoice`/`InvoiceItem` (`tbl_supplier_invoice`) vía `InvoiceController` → `/api/v1/purchases` (`R/operation/invoice/controller/InvoiceController.java:21`).
- Nueva (refactor V4): `PurchaseInvoice` (`tbl_purchase_invoices`) vía `PurchaseInvoiceController` → `/api/purchase-invoices` (`R/operation/invoice/controller/PurchaseInvoiceController.java:22`).
El refactor de separación Sales/Purchase quedó a medias: el modelo antiguo no se retiró.

---

## 4. Lógica de negocio duplicada / divergente (backoffice vs portal)

**Premisa clave:** el portal (ecommerce) **no calcula precio ni stock contra el backend**; usa `PRODUCTS` mock (`frontend/ecommerce/src/app/core/data/mock-data`). No hay, hoy, divergencia "en caliente" portal↔backoffice porque **el portal está desconectado de la API**. El riesgo real no es divergencia sino ausencia total de integración del portal.

**Precio — fuente de verdad:** `PricingServiceImpl` (`R/catalog/pricing/service/PricingServiceImpl.java:22`) es la única fuente viva (`createOrUpdatePrice:27`, `updatePurchasePrice:44`, `getProductPrices:58`, `createSnapshot:64` con `purchasePrice/suggestedPrice/suggestedWebPrice/taxRate`). La entidad viva es `Price` (`tbl_prices`). **Divergencia interna**: existe además la entidad muerta `ProductPrice` (§2.1), un segundo modelo de precio no usado. Consumo sólo desde backoffice (vía `PricingServiceClient` in-process); el portal no tiene endpoint público de precios (todo bajo `/api/v1/**` exige autenticación, §6).

**Stock — múltiples caminos:**
- `inventory/StockServiceImpl` (`R/inventory/service/StockServiceImpl.java:21`): **ledger real** (`registerMovement:28`, `getProductStock:44`, `hasMovementsForProduct:78`). Es la fuente de verdad; se alimenta desde ventas/facturas vía `InventoryServiceClient.registerInvoiceMovement/registerSaleMovement`.
- `catalog/product/ProductStockServiceImpl` (`R/catalog/product/service/ProductStockServiceImpl.java:19`): **segundo camino divergente y muerto** (`updateFromInvoice:29`, `updateFromOrder:45`) tras `ProductStockController` (§3). Duplica la responsabilidad de mover stock desde factura, pero sin llamante.
- `inventory/InventoryService` (`R/inventory/service/InventoryService.java:27`): sesiones de recuento físico (dominio distinto, legítimo).

Conclusión: la fuente única de verdad de stock es `StockService`, pero existe un camino paralelo (`ProductStockService`) muerto que debe eliminarse para evitar futura divergencia. El portal no lee stock del backend.

---

## 5. Deuda técnica estructural (ejemplos concretos)

1. **Configuración Flyway/RabbitMQ fuera del namespace `spring:`** — `src/main/resources/application.yaml`: las claves `flyway:` (línea 30) y `rabbitmq:` (línea 77) están al **nivel raíz**, no bajo `spring:` (que termina antes). Spring Boot enlaza `spring.flyway.*` y `spring.rabbitmq.*`; tal como está, `baselineOnMigrate: true`, `validateOnMigrate`, `locations`, etc. **no se aplican** (quedan como propiedades sueltas). Verificar/mover bajo `spring:`. (Riesgo alto; confirmar con arranque real — fuera de ámbito de esta fase.)

2. **Gestión de esquema incompleta e inconsistente entre entornos** — no hay `CREATE TABLE` para las tablas base en ninguna migración (V1 hace `ALTER TABLE tbl_products …` asumiendo existencia; `docker/postgres/init` no crea tablas). `dev` usa `ddl-auto: update` (Hibernate crea todo), `prod` usa `validate` (no crea nada) ⇒ un despliegue limpio en `prod` no tiene forma de materializar el esquema base. Sumado a la divergencia `tbl_invoices` JOINED de V4 (§2.3), el esquema no es reproducible por migraciones.

3. **Límites de transacción ausentes en operaciones multi-escritura** — `CashServiceImpl` no tiene ningún `@Transactional` (clase en `R/operation/cash/service/CashServiceImpl.java:26`). `openSession` (`:43`) hace dos escrituras no atómicas: `sessionRepository.save` (`:67`) + `movementRepository.save(openingMovement)` (`:81`); igual en `closeSession` (`:106` + `:120`). Si falla la segunda, queda sesión sin su movimiento de apertura/cierre. Mismo patrón sin `@Transactional` en `BranchServiceImpl` y `CompanyServiceImpl` (crean branch + localizaciones/depósitos). De 49 servicios, 23 no tienen `@Transactional` (varios son legítimos: clientes in-process, JWT, email).

4. **Lógica y manejo de errores en la capa controller, duplicando el `@ControllerAdvice`** — existe `GlobalExceptionHandler` (`R/shared/exception/GlobalExceptionHandler.java`, `@ControllerAdvice`), pero `FiscalComplianceController` y `PriceItemController` hacen `catch (Exception e)` y construyen manualmente `Map<String,Object>` de respuesta de error dentro del endpoint (`FiscalComplianceController.java:78,87-95,127,136-...`). Además recupera la entidad y arma el DTO en el propio controller (`:68-86`). Mezcla de responsabilidades y respuestas de error divergentes del advice global. Hay 52 `catch (Exception|RuntimeException)` genéricos en el código; la mayoría en `shared/client/*` que tragan cualquier excepción y la reenvían como `BusinessException` genérica, perdiendo la causa tipada.

5. **Acoplamiento y multi-tenancy inconsistente** — dos mecanismos de resolución de tenant conviven: `TenantContext.getTenantId()` (usado 18 veces, p. ej. filtros/otros servicios) frente a `InventoryService`, que recibe `Long tenantId` **como parámetro manual** en todos sus métodos (`InventoryService.java:38,63,74,…`). Esto obliga al controller a inyectar el tenant y abre riesgo de pasar un tenant erróneo, saltándose el contexto centralizado. Además, la capa `shared/client/*ServiceClient` es una **frontera de microservicio falsa**: envuelve servicios in-process con try/catch genérico, añadiendo indirección sin aislamiento real (herencia de la arquitectura microservicios ya colapsada a monolito — ver `application.yaml:18` "DISABLE SPRING CLOUD CONFIG (Monolith Activation)").

**N+1 / fetching:** riesgo bajo por EAGER — sólo 1 relación `EAGER` (`R/catalog/product/model/ProductPriceLink.java:33`, `@ManyToOne EAGER`) y 10 `@OneToMany`. No hay `spring.jpa.open-in-view` explícito (queda en `true` por defecto), lo que puede enmascarar lazy-loading en serialización; conviene fijarlo en `false` y revisar los `@OneToMany` de agregados (Invoice/Quote/Sale items) por fetch en bucles.

---

## 6. Seguridad estructural REAL del backend

(Informe de seguridad completo lo realiza otro agente; aquí sólo lo estructural del código.)

**Lo que SÍ existe:**
- `SecurityConfig` (`R/auth/security/config/SecurityConfig.java:34`): `@EnableWebSecurity` + `@EnableMethodSecurity` (línea 36). Cadena de filtros con:
  - Sesiones **STATELESS**, CSRF deshabilitado (correcto para API JWT).
  - **CORS** con orígenes por propiedad `app.security.cors.allowed-origins`, `allowCredentials=true`, normalización de orígenes.
  - Cabeceras de seguridad: `frameOptions.deny()` y CSP `default-src 'self'` (líneas 96-98).
  - `EntryPoint`/`AccessDeniedHandler` REST personalizados (`RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`) con `SecurityErrorResponseWriter`.
- **JWT**: `JwtService` (`R/auth/security/jwt/JwtService.java`) + `JwtFilter` (registrado antes de `UsernamePasswordAuthenticationFilter`, `SecurityConfig` línea final) + `SecurityUserDetailsService` / `SecurityUser` / `SecurityAccount` (`tbl_security_accounts`) + `RefreshToken` (rotación). `BCryptPasswordEncoder` como `PasswordEncoder`.
- **Multi-tenancy**: `TenantFilter` + `TenantContext` (`R/shared/security/`).
- **RBAC por método**: 140 anotaciones `@PreAuthorize/@Secured` en el código. `/api/v1/admin/**` y `/actuator/**` requieren `ROLE_ADMIN`.
- Actuator endurecido (`application.yaml:53-...`, expone sólo `health,info,metrics`).

**Debilidades estructurales observadas (no exhaustivo — detalle en informe de seguridad):**
- **RBAC inconsistente:** varios controladores con datos sensibles tienen **cero** `@PreAuthorize` y sólo dependen de `anyRequest().authenticated()`: `SalesInvoiceController`, `PurchaseInvoiceController`, `QuoteController`, `InventoryController` (0 cada uno), frente a `BrandController`/`BranchController` (11) o `CustomerController`/`CategoryController` (10). Cualquier usuario autenticado (de cualquier rol) puede operarlos.
- **Regla pública demasiado amplia:** `SecurityConfig` línea `requestMatchers("/api/v1/auth/**").permitAll()` deja públicos también `/api/v1/auth/me`, `/logout`, `/logout-all` (no sólo login/refresh que sí están en `PUBLIC_ENDPOINTS`).
- Los controladores `/internal/**` (superficie muerta, §3) caen en `anyRequest().authenticated()`: expuestos y autenticables aunque sin llamante.

---

## 7. Integración de pagos / ecommerce

**No existe ninguna integración de pasarela de pago.** Verificado con `grep -in "stripe|paypal|mercadopago|checkout|webhook|payment gateway|paymentintent|carrito|cart"` en todo `retail-api/src` → **0 coincidencias**. No hay controladores de checkout, ni webhooks, ni verificación de firma, ni lógica de idempotencia de pagos.

- El término **"payment"** en el backend se refiere exclusivamente a `SupplierPayment` (cuentas por pagar a proveedores): entidad `R/operation/invoice/model/SupplierPayment.java` (`tbl_supplier_payment`), `SupplierPaymentRepository`, DTOs `SupplierPaymentRequest/Response`, y endpoints `POST /api/v1/purchases/supplier/{id}/payments` (`InvoiceController`) y `POST /api/sales-invoices/{id}/payments` (`SalesInvoiceController`). Es registro contable de pagos, **no cobro online**.
- **Carrito / checkout**: sólo en el portal y sólo en cliente — `frontend/ecommerce/src/app/core/services/cart.service.ts` (sin HTTP; estado local). No hay endpoint de carrito ni de pedido en el backend.
- **Módulo Order inexistente**: `OrderServiceClient` (`R/shared/client/OrderServiceClient.java`) es un stub con `// TODO … when Order service is available` que devuelve `false`/`0`. `ProductStockController /from-order` y `ProductStockServiceImpl.updateFromOrder` apuntan a ese módulo ausente (código muerto, §3/§4).

**Estado de completitud:** la integración e-commerce (portal→backend, pedidos, cobros) está **inexistente**. El portal es una maqueta con datos mock; el backend no tiene superficie pública que el portal pudiera consumir. Seguridad de pagos (idempotencia, validación de firma de webhook): **N/A por inexistencia**.

---

## Anexo — Cómo se verificó

- Controladores/servicios/repos/entidades: `grep -rl` de anotaciones sobre `R`.
- Endpoints: extracción de `@*Mapping` por controlador.
- Consumo frontend: literales `/(api|internal)/…` en `frontend/web-client/src` y `frontend/ecommerce/src`; verificación de ausencia de `HttpClient` en ecommerce.
- Métodos huérfanos: extracción de firmas `public` + conteo de invocaciones `.<metodo>(` en `src` excluyendo el fichero declarante; confirmación manual de los casos dudosos.
- Esquema: `db/migration/V1–V4`, `docker/postgres/init`, `application*.yml`.
