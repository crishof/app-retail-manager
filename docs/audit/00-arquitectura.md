# FASE 0 — Auditoría de Arquitectura (app-retailmanager)

> Auditoría **solo lectura** verificada contra el código real (no contra los `.md` previos del repo).
> Fecha de auditoría: 2026-07-16. Rama: `mono`.
> Cada hallazgo referencia `archivo:línea` (ruta relativa a la raíz del repo).
> Cuando algo no pudo determinarse con certeza se indica explícitamente "No determinado".

---

## 0. Resumen de la arquitectura real (en una frase)

Lo que el árbol de carpetas presenta como "microservicios Spring Cloud" es en realidad **un monolito modular por dominio (DDD) llamado `retail-api`**, con la infraestructura Spring Cloud (Eureka, Config Server, API Gateway) **presente en el repo pero desactivada** (marcada como *legacy* en el POM padre y deshabilitada por configuración), acompañado de **un backoffice Angular real (`web-client`)**, **un portal ecommerce Angular que hoy es solo un prototipo con datos mock (`ecommerce`)** y **un esqueleto de carpetas vacío (`erp-structure`)**.

---

## 1. Estructura del monorepo

### 1.1 Backend — `backend/erphub-api/microservices/`

POM padre: `backend/erphub-api/microservices/pom.xml`.

Módulos declarados (`pom.xml:37-49`):

| Módulo | Estado según POM padre | Rol |
|---|---|---|
| `retail-api` | **Activo** | Servicio de dominio principal (monolito modular) |
| `api-gateway` | **Legacy** — `pom.xml:41-46`: "No están en uso actualmente… se mantienen aquí para referencia" | Spring Cloud Gateway (WebFlux) |
| `config-server` | **Legacy** (idem) | Spring Cloud Config Server (modo `native`) |
| `service-registry` | **Legacy** (idem) | Eureka Server |

**Confirmación de que es un monolito, no microservicios en ejecución:**

- `retail-api/src/main/resources/application.yaml:30-35` → `spring.cloud.config.enabled: false` con comentario "DISABLE SPRING CLOUD CONFIG (Phase 5, Monolith Activation)".
- `application-dev.yml:63-65`, `application-docker.yml`, `application-prod.yml` → `eureka.client.enabled: false` con comentario "No Eureka for monolith - direct service communication only".
- `application.yaml:52-54` → `rabbitmq.event-sync.enabled: false` ("Disabled for MVP - event sync replaced with direct service calls").
- `retail-api/pom.xml` → comentarios: "Removed spring-cloud-starter-circuitbreaker-resilience4j", "Removed spring-cloud-starter-openfeign (replaced with direct service injection)". Aún declara `spring-cloud-starter-config` y `spring-cloud-starter-netflix-eureka-client`, pero ambos están desactivados por config.
- `RetailApiApplication.java:7-9` → solo `@SpringBootApplication` + `@EnableSpringDataWebSupport`; **no** hay `@EnableDiscoveryClient`/`@EnableEurekaClient`.

**Evidencia histórica de que ANTES fue microservicios-por-dominio:** el Config Server conserva 40+ ficheros de config por servicio en `config-server/src/main/resources/config/` (p. ej. `identity-sv.yml`, `product-sv.yml`, `sales-sv.yml`, `tenant-sv.yml`, `inventory-sv.yml`…). El `docker-compose.prod.yml` tiene **18 servicios `*-sv` comentados** (`branch-sv`…`tenant-sv`) y el `api-gateway.yml` tiene todas las rutas por dominio comentadas dejando una sola ruta activa (ver §5). Todo ese dominio se consolidó dentro de `retail-api`.

#### Paquetes de `retail-api` (com.zaphirio.retailapi)

Organización DDD por dominio (verificado en `retail-api/src/main/java/com/zaphirio/retailapi`):

- `auth` — autenticación JWT, registro, invitaciones, recuperación de contraseña, seguridad (`auth/security/**`).
- `catalog` — `brand`, `category`, `pricing`, `product`, `supplierCatalog` (con `ingestion`).
- `inventory` — sesiones de inventario y stock.
- `media/image` — gestión de imágenes (Cloudinary).
- `operation` — `cash`, `invoice` (sales/purchase/compliance), `quote`, `sales`.
- `party` — `branch`, `customer`, `supplier` (+ `company`).
- `shared` — `audit`, `client`, `config`, `exception`, `fiscal`, `persistence`, `security` (multitenancy: `TenantContext`, `TenantFilter`), `service`, `tenancy`, `validation`.

Métricas verificadas: **31 controllers** con endpoints REST (+ `GlobalExceptionHandler`), **41 clases `@Entity`**, **4 migraciones Flyway**.

#### Versiones backend (verificadas en `pom.xml`)

- Java: **25** (`pom.xml:59`)
- Spring Boot: **4.0.6** (`pom.xml:64`)
- Spring Cloud: **2025.1.1** (`pom.xml:65`)
- Lombok 1.18.46, MapStruct 1.6.3, springdoc 2.8.8, jjwt 0.12.7, JaCoCo 0.8.14 (`pom.xml:70-88`).
- Dependencias clave de `retail-api` (`retail-api/pom.xml`): `spring-boot-starter-webmvc` **y** `webflux`, `data-jpa`, `flyway-core` + `flyway-database-postgresql`, `spring-boot-starter-actuator`, `spring-boot-starter-amqp` (RabbitMQ), `springdoc-openapi-starter-webmvc-ui`, `postgresql`, `poi-ooxml` (Excel), `cloudinary-http44`, `spring-boot-starter-mail`, `jjwt`, `spring-boot-starter-security`, `validation`, `devtools`.

#### Migraciones Flyway

`retail-api/src/main/resources/db/migration/`:
- `V1__Add_tenant_multi_tenancy_support.sql`
- `V2__create_audit_and_versioning_tables.sql`
- `V3__Refactor_User_FullName_To_FirstName_LastName.sql`
- `V4__Refactor_Invoice_Hierarchy_Sales_Purchase_Separation.sql`

Nota: en `dev`/`docker` el JPA usa `ddl-auto: update` y en `prod` `ddl-auto: validate` (`application-prod.yml:34`), conviviendo con Flyway.

### 1.2 Frontend — `frontend/`

**No es un workspace Angular compartido ni un monorepo con herramienta (Nx/pnpm-workspace).** No existe `package.json`, `nx.json` ni `pnpm-workspace.yaml` en la raíz; cada app es un proyecto Angular independiente con su propio `angular.json` de un único `project`. **No comparten librerías ni componentes** (no hay `projects/` ni paths compartidos entre apps).

| App | package name | Rol | Angular | Node | Estado |
|---|---|---|---|---|---|
| `web-client` | `retailmanager` | **Backoffice ERP** | 21.2.9 | `>=20.19.0` | App real, con SSR |
| `ecommerce` | `ecommerce` | **Portal ecommerce** | 21.2.x | (npm 11.13.0) | **Prototipo con datos mock** |
| `erp-structure` | — (sin `package.json`) | Esqueleto de carpetas | — | — | **Stub vacío** |

**`web-client` (backoffice)** — `frontend/web-client/package.json`:
- Deps clave: `@angular/material` 21.2.7, `@angular/cdk`, `@angular/ssr` + `@angular/platform-server` + `express` (SSR real, `server.ts`), `bootstrap` 5.3.8, `jquery` 4.0.0, `echarts` 6.1.0 + `echarts-gl`, `jwt-decode`, `@popperjs/core`.
- Dev: `tailwindcss` 3.4.19, `autoprefixer`, `postcss`, Karma/Jasmine.
- Tiene `vercel.json` (`buildCommand: npm run build:prod`, `outputDirectory: dist/retailmanager/browser`, SPA fallback y cabeceras de seguridad X-Frame-Options/nosniff).
- Stack de UI mixto: Material + Bootstrap + jQuery + Tailwind + ECharts (coexistencia de 4 sistemas de estilos/DOM).

**`ecommerce` (portal)** — `frontend/ecommerce/package.json`:
- Deps **mínimas**: solo `@angular/{common,compiler,core,forms,platform-browser,router}`, `rxjs`, `tslib`. **Sin** Material, Bootstrap, Tailwind ni jQuery. Test con `vitest` + `jsdom`.
- **Sin `vercel.json`** dentro de la carpeta (aunque `web-client/environments` apunta a `https://retail-ecommerce-sigma.vercel.app`, ver §3).
- **No consume el backend hoy**: provee `provideHttpClient(withFetch())` en `app.config.ts:11` pero **ningún servicio hace llamadas HTTP**. `product.service.ts:3` importa `PRODUCTS` de `core/data/mock-data.ts`; `tenant.service.ts:3` usa `TENANTS` mock. Es un prototipo de UI 100% estático (multi-tenant simulado vía `localStorage`).

**`erp-structure` y `web-client/src/erp-structure-reference`** — **ambos son esqueletos de directorios VACÍOS (0 ficheros)**. Contienen solo carpetas anidadas que describen una estructura ERP propuesta en español (`features/ventas`, `compras`, `almacen`, `finanzas`, `gestion`, `configuracion`, `shared/components/...`). Las dos ubicaciones son idénticas en estructura: es documentación de arquitectura objetivo materializada como carpetas, **no código** y **no compilable**. Duplicación: sí, la misma jerarquía existe copiada en dos lugares, pero sin ficheros no hay duplicación de código real.

---

## 2. Docker / Compose

Ubicación: `backend/erphub-api/docker/`.

### `docker-compose.yml` (dev) — solo infraestructura

Levanta **únicamente 2 servicios** (`docker/compose/docker-compose.yml`):
- **`postgres`** — `postgres:17-alpine`, puerto host `${POSTGRES_HOST_PORT}:${POSTGRES_CONTAINER_PORT}` (= `5544:5432`), volumen `postgres_data`, monta `../postgres/init` como scripts de init, healthcheck `pg_isready`.
- **`rabbitmq`** — `rabbitmq:3.13-management-alpine`, puertos `5672` (AMQP) y `15672` (management UI), volumen `rabbitmq_data`, healthcheck `rabbitmq-diagnostics ping`.
- Red bridge `erphub-net`. **No** levanta `retail-api` ni ningún servicio de aplicación: la app se ejecuta desde el IDE/host contra estos contenedores.

**RabbitMQ está desplegado en compose pero el event-sync de la app está desactivado** (`application.yaml:52-54`); RabbitMQ queda como infra presente pero sin uso funcional actual.

### `docker-compose.prod.yml` — desalineado con el monolito

`docker/compose/docker-compose.prod.yml` define `postgres`, `rabbitmq`, **`service-registry`, `config-server`, `api-gateway`** (activos, se construyen desde sus `Dockerfile`) y **18 microservicios `*-sv` comentados**. **No incluye `retail-api`**. Es decir, el compose de producción describe la **arquitectura antigua** (gateway+eureka+config+servicios por dominio) y **no despliega la aplicación real (`retail-api`)** — está obsoleto respecto a la consolidación en monolito.

### Postgres init

`docker/postgres/init/01-create-databases.sql` crea **solo `retail_db`**; el resto de bases por dominio (`branch_db`, `product_db`, `sales_db`, …) están **comentadas** — coherente con el monolito (una sola base). `02-grant-privileges.sql` también presente.

### Otros servicios de infra

- **Pasarela de pago:** No determinado / no presente. No hay dependencias ni configuración de Stripe/MercadoPago/PayPal en backend ni frontend (búsqueda sin resultados en poms y servicios).
- **Ecommerce headless:** el portal `ecommerce` no está conectado al backend (datos mock), por lo que hoy **no hay** integración headless real.
- **Cloudinary** (media) y **Brevo/SMTP** (email) son servicios externos usados por `retail-api` (ver §3), no contenedores.

---

## 3. Variables de entorno: hardcodeadas vs externalizadas

### Backend

La mayoría de valores están **externalizados** con placeholders `${VAR:default}`. Puntos a destacar:

**Secretos con DEFAULT hardcodeado en ficheros versionados (riesgo):**
- **JWT secret** por defecto en claro: `application-dev.yml:70`, `application-docker.yml`, `application-prod.yml` → `jwt.secret_key: ${BASE64_SECRET_KEY:vzxp+DRFX2QpTbzrY+l0nQ10fs9Cepmc3v5/mslcDno=}`. El mismo secreto por defecto se usa en **prod**. En `config-server/config/retail-api.yml:...` hay otro default distinto (`MDEyMzQ1...`).
- **Password de Postgres** por defecto `root1234` en `application-dev.yml:9`, `-docker.yml`, `-prod.yml` (`${POSTGRES_PASSWORD:root1234}`).

**Fichero `.env` con secretos REALES (no versionado):** `backend/erphub-api/docker/compose/.env` **está en `.gitignore`** (`git check-ignore` confirma; `.gitignore:44-47`), por lo que no está commiteado. No obstante contiene secretos reales en claro en el disco local: contraseña de aplicación Gmail (`MAIL_PASSWORD=aeybjdqyssjlpxqy`), `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY`, `BASE64_SECRET_KEY`. `.env.example` es la plantilla segura (valores vacíos).

**Variables externalizadas relevantes** (`application-*.yml`, `.env`): `SPRING_PROFILES_ACTIVE`, `POSTGRES_{HOST,PORT,USER,PASSWORD}`, `RABBITMQ_{HOST,PORT,DEFAULT_USER,DEFAULT_PASS}`, `MAIL_{HOST,PORT,USERNAME,PASSWORD,...}`, `BREVO_API_{URL,KEY}`, `CORS_ALLOWED_ORIGINS`, `JWT_EXPIRATION`/`JWT_REFRESH_EXPIRATION`, `RESET_PASSWORD_BASE_URL`, `ACCEPT_INVITE_BASE_URL`, `CLOUDINARY_*`.

**CORS:** externalizado vía `app.security.cors.allowed-origins` (`SecurityConfig.java:73-74`), default dev `localhost:3000/4200/5173`. En prod: `https://app.erphub.io,https://erphub.io` (`application-prod.yml`). El `api-gateway.yml` (legacy) tiene CORS **hardcodeado** a `http://localhost:4200`.

**Puertos:** `retail-api` → `9020` (`application-dev.yml:2`); Postgres host `5544` / contenedor `5432`; RabbitMQ `5672`/`15672`; (legacy) gateway `8080`, config-server `8088`, eureka `8761`.

### Frontend

**`web-client`** — `src/environments/environment.ts` (dev) y `environment.prod.ts`:
- dev: `gatewayUrl: http://localhost:9020`, `apiUrl: .../api/v1`, `authUrl: .../api/v1/auth`, `ecommerceUrl: http://localhost:4300`.
- prod: `gatewayUrl/apiUrl: https://api.retailmanager.com`, `ecommerceUrl: https://retail-ecommerce-sigma.vercel.app`.
- Nota: el dominio prod del frontend (`api.retailmanager.com`) **no coincide** con el dominio prod del backend (`app.erphub.io`/`erphub.io` en `application-prod.yml`). Inconsistencia de dominios entre capas.

**`ecommerce`** — **no tiene ficheros `environment*.ts`** (búsqueda sin resultados). Al usar datos mock, no hay URL de backend configurada.

---

## 4. Estado de compilación / arranque (hoy)

- **Compilación: los 3 builds pasan** (según el punto de partida provisto por el encargo; no se reejecutaron builds en esta auditoría de solo lectura).
  - `retail-api`: compila (Maven offline, exit 0).
  - `web-client`: build prod exit 0, **con warning de CSS**.
  - `ecommerce`: build exit 0.
- **Warning CSS (web-client):** en `src/styles.css` la regla `@import './styles/design-tokens.css';` está en la **línea 5**, después de las directivas `@tailwind base/components/utilities` (líneas 1-3). CSS exige que `@import` preceda a cualquier otra sentencia → warning "@import must precede all other statements". (El encargo lo citaba como `styles.css:1`; la ubicación real es `styles.css:5`.)
- **Arranque en runtime: NO verificado.** No se levantó ninguna app ni contenedor. La conectividad real frontend↔backend no fue ejercitada (ver los desajustes de rutas en §5, que son estáticos por lectura de código y podrían provocar 404 en runtime).

---

## 5. Inventario de endpoints REST

### 5.1 Rutas del API Gateway (legacy, desactivado)

`config-server/src/main/resources/config/api-gateway.yml` — **una sola ruta activa**: `id: retail-api`, `uri: lb://RETAIL-API`, `predicates: Path=/api/v1/**`. Todas las rutas `*-sv` por dominio están **comentadas**. Como el gateway y Eureka están apagados, el frontend llama **directamente** a `retail-api` en `:9020` (`environment.gatewayUrl`).

### 5.2 Modelo de seguridad (contexto para la tabla)

`auth/security/config/SecurityConfig.java`:
- `@EnableMethodSecurity` → se aplican los `@PreAuthorize` a nivel de método.
- Cadena de filtros (`securityFilterChain`, líneas ~90-118): `permitAll` para `OPTIONS /**`, `/error`, swagger, `/actuator/health`, `/api/v1/auth/**`, `/api/v1/registration/**`, `/api/v1/invitations/**`; `hasRole('ADMIN')` para `/api/v1/admin/**` y `/actuator/**`; **`anyRequest().authenticated()`** para todo lo demás.
- Roles usados en `@PreAuthorize`: `ADMIN`, `MANAGER`, `EMPLOYEE`, y en compliance también `APPROVER`, `AUDITOR`.
- **Controllers SIN `@PreAuthorize`** (quedan solo bajo `authenticated()`, cualquier rol autenticado): `InventoryController`, `PurchaseInvoiceController`, `SalesInvoiceController`, `QuoteController`. Ver notas al pie de la tabla.

Leyenda columna "Frontend consumidor": **Backoffice** = `web-client`; **Portal** = `ecommerce`; **Ninguno** = no consumido por frontend (típicamente `/internal/**` para uso interno server-side); **No determinado** = no se halló consumidor con certeza.

> Total verificado: **31 controllers**, **~197 endpoints**. **Portal (`ecommerce`) consume 0 endpoints** (usa mock). Los controllers `/internal/**` (5) y varios más no tienen consumidor frontend.

#### AUTH

| Controller (`archivo`) | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| AdminInvitationController `auth/controller/AdminInvitationController.java:26` | POST `/api/v1/admin/invitations` | `hasRole(ADMIN)` (clase+método) + URL `/admin/**`=ADMIN | No determinado |
| AuthController `auth/controller/AuthController.java:27` | POST `/api/v1/auth/login` | `permitAll` | Backoffice (`auth.service.ts:163`) |
| | POST `/api/v1/auth/logout` | `permitAll` | Backoffice (`:200`) |
| | POST `/api/v1/auth/logout-all` | `hasAnyRole(ADMIN,MANAGER,EMPLOYEE)` | Backoffice (`:216`) |
| | POST `/api/v1/auth/refresh` | `permitAll` | Backoffice (`:353`) |
| | GET `/api/v1/auth/me` | `hasAnyRole(ADMIN,MANAGER,EMPLOYEE)` | Backoffice (`:375`) |
| InvitationsController `auth/controller/InvitationsController.java:22` | GET `/api/v1/invitations/{token}/info` | `permitAll` | No determinado |
| | POST `/api/v1/invitations/accept` | `permitAll` | No determinado |
| PasswordRecoveryController `auth/controller/PasswordRecoveryController.java:25` | POST `/api/v1/auth/password/forgot` | `permitAll` | Backoffice (`auth.service.ts:309`) |
| | POST `/api/v1/auth/password/reset` | `permitAll` | Backoffice (`:329`) |
| RegistrationController `auth/controller/RegistrationController.java:24` | POST `/api/v1/auth/registration/signup` (+`/api/v1/registration/signup`) | `permitAll` | Backoffice (`auth.service.ts:237`) |
| | POST `.../verify-email` | `permitAll` | Backoffice (`:264`) |
| | POST `.../resend-verification` | `permitAll` | Backoffice (`:292`) |

#### CATALOG

| Controller | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| BrandController `catalog/brand/controller/BrandController.java:33` | GET `/api/v1/brands/status` | EMPLOYEE+ | Backoffice (`brand.service.ts`) |
| | POST `/api/v1/brands` (multipart) | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/brands` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/brands/{id}` | EMPLOYEE+ | Backoffice |
| | PATCH `/api/v1/brands/{id}` (multipart) | ADMIN,MANAGER | Backoffice |
| | DELETE `/api/v1/brands/{id}` | ADMIN,MANAGER | Backoffice |
| | DELETE `/api/v1/brands/{id}/force` | ADMIN | Backoffice |
| | PATCH `/api/v1/brands/{id}/logo` | ADMIN,MANAGER | Backoffice |
| | PATCH `/api/v1/brands/{id}/restore` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/brands/count` | EMPLOYEE+ | Backoffice |
| | PUT `/api/v1/brands/{id}/merge` | ADMIN | Backoffice (`brand.service.ts:116`) |
| BrandInternalController `catalog/brand/controller/BrandInternalController.java:16` | GET `/internal/brands/getByNameOrCreate` | ADMIN,MANAGER | Ninguno (interno) |
| CategoryController `catalog/category/controller/CategoryController.java:29` | POST `/api/v1/categories` (multipart) | ADMIN,MANAGER | Backoffice (`category.service.ts`) |
| | GET `/api/v1/categories` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/categories/{id}` | EMPLOYEE+ | Backoffice |
| | PATCH `/api/v1/categories/{id}` (multipart) | ADMIN,MANAGER | Backoffice |
| | DELETE `/api/v1/categories/{id}` | ADMIN | Backoffice |
| | PATCH `/api/v1/categories/{id}/image` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/categories/count` | EMPLOYEE+ | Backoffice |
| | PATCH `/api/v1/categories/{id}/parent` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/categories/tree` | EMPLOYEE+ | Backoffice (`category.service.ts:150`) |
| | GET `/api/v1/categories/{id}/tree` | EMPLOYEE+ | Backoffice (`:157`) |
| CategoryInternalController `catalog/category/controller/CategoryInternalController.java:16` | GET `/internal/categories/getByNameOrCreate` | ADMIN,MANAGER | Ninguno (interno) |
| PricingController `catalog/pricing/controller/PricingController.java:19` | POST `/internal/pricing` | ADMIN,MANAGER | Ninguno (interno) |
| | POST `/internal/pricing/purchase` | ADMIN,MANAGER | Ninguno |
| | GET `/internal/pricing/product/{productId}` | EMPLOYEE+ | Ninguno |
| | POST `/internal/pricing/snapshot` | ADMIN,MANAGER | Ninguno |
| ProductController `catalog/product/controller/ProductController.java:29` | GET `/api/v1/products/status` | EMPLOYEE+ | Backoffice (`product.service.ts`) |
| | GET `/api/v1/products` | EMPLOYEE+ | Backoffice (+ analytics/dashboard/inventory-data) |
| | GET `/api/v1/products/{id}` | EMPLOYEE+ | Backoffice |
| | POST `/api/v1/products` | ADMIN,MANAGER | Backoffice |
| | PATCH `/api/v1/products/{id}` | ADMIN,MANAGER | Backoffice |
| | DELETE `/api/v1/products/{id}` | ADMIN | Backoffice |
| | DELETE `/api/v1/products/{id}/force` | ADMIN | Backoffice |
| | PATCH `/api/v1/products/{id}/restore` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/products/count` | EMPLOYEE+ | Backoffice |
| ProductImportController `catalog/product/controller/ProductImportController.java:19` | POST `/api/v1/products/import/supplier` | ADMIN,MANAGER | Backoffice (`supplier-price-list.service.ts:52-53,155`) |
| ProductInternalController `catalog/product/controller/ProductInternalController.java:19` | GET `/internal/products/brand/{brandId}/exists` | ADMIN,MANAGER | Ninguno (interno) |
| | PATCH `/internal/products/brand` | ADMIN,MANAGER | Ninguno |
| | PATCH `/internal/products/category/{categoryId}` | ADMIN,MANAGER | Ninguno |
| | PATCH `/internal/products/category` | ADMIN,MANAGER | Ninguno |
| | PATCH `/internal/products/category/{categoryId}/clear` | ADMIN,MANAGER | Ninguno |
| | GET `/internal/products/supplier/{id}/exist` | ADMIN,MANAGER | Ninguno |
| ProductPriceLinkController `catalog/product/controller/ProductPriceLinkController.java:17` | POST `/api/v1/product-price-links` | ADMIN,MANAGER | Backoffice (`product-price-link.service.ts`) |
| | PATCH `/api/v1/product-price-links/price-update` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/product-price-links/alerts` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/product-price-links/alerts/product/{productId}` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/product-price-links/{linkId}` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/product-price-links/{linkId}/history` | EMPLOYEE+ | Backoffice |
| ProductStockController `catalog/product/controller/ProductStockController.java:16` | PUT `/api/v1/products/stock/from-invoice` | ADMIN,MANAGER | Ninguno (no hallado en frontend) |
| | PUT `/api/v1/products/stock/from-order` | ADMIN,MANAGER | Ninguno |
| PriceItemController `catalog/supplierCatalog/controller/PriceItemController.java:20` | POST `/api/v1/price-items/import` | ADMIN,MANAGER | Backoffice (`supplier-price-list.service.ts:51,76`) |
| | POST `/api/v1/price-items/parse-headers` | ADMIN,MANAGER | Backoffice (`:85`) |
| | GET `/api/v1/price-items` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/price-items/{id}` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/price-items/brands` | EMPLOYEE+ | Backoffice (`:140`) |
| ImportJobController `catalog/supplierCatalog/ingestion/controller/ImportJobController.java:18` | POST `/api/v1/import-jobs` | ADMIN,MANAGER | Backoffice (`supplier-price-list.service.ts:54-55,166`) |
| | GET `/api/v1/import-jobs/{jobId}` | EMPLOYEE+ | Backoffice (`:170`) |
| | GET `/api/v1/import-jobs` | EMPLOYEE+ | Backoffice (`:166`) |

#### INVENTORY

| Controller | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| InventoryController `inventory/controller/InventoryController.java:21` | POST `/api/inventory/sessions`; GET `/api/inventory/sessions/{id}`; GET `/api/inventory/sessions`; GET `/api/inventory/sessions/branch/{branchId}`; GET `.../deposit/{depositId}`; GET `.../status/{status}`; GET `.../active`; GET `.../date-range`; PUT `.../{id}`; POST `.../{id}/start`; POST `.../{id}/complete`; POST `.../{id}/confirm`; DELETE `.../{id}`; POST `.../{sessionId}/items`; GET `/api/inventory/items/{id}`; GET `.../{sessionId}/items`; GET `.../{sessionId}/discrepancies`; PUT `/api/inventory/items/{id}`; DELETE `/api/inventory/items/{id}` (**19 endpoints**) | **Sin `@PreAuthorize`** → solo `authenticated()` | Backoffice `inventory.service.ts` **con desajuste de ruta** (ver nota ⚠️1) |
| InventoryPublicController `inventory/controller/InventoryPublicController.java:14` | GET `/api/v1/inventory/product/{productId}/stock` | EMPLOYEE+ | No determinado (⚠️2) |
| | GET `/api/v1/inventory/movements/reference/{referenceId}` | EMPLOYEE+ | No determinado |

#### MEDIA

| Controller | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| ImageInternalController `media/image/controller/ImageInternalController.java:15` | POST `/internal/images/upload` | ADMIN,MANAGER | Ninguno (interno) |
| | PUT `/internal/images/replace` | ADMIN,MANAGER | Ninguno |
| | DELETE `/internal/images/delete` | ADMIN | Ninguno |

#### OPERATION

| Controller | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| CashController `operation/cash/controller/CashController.java:17` | POST `/api/v1/cash/sessions` | ADMIN,MANAGER | Backoffice (`cash.service.ts`) |
| | PUT `/api/v1/cash/sessions/{sessionId}/close` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/cash/sessions/current` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/cash/sessions` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/cash/sessions/{sessionId}` | EMPLOYEE+ | Backoffice |
| | POST `/api/v1/cash/sessions/{sessionId}/movements` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/cash/sessions/{sessionId}/movements` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/cash/exchange-rates` | EMPLOYEE+ | Backoffice (`cash.service.ts:121`) |
| FiscalComplianceController `operation/invoice/controller/FiscalComplianceController.java:35` | POST `/api/v1/compliance/invoices/{invoiceId}/finalize` | ADMIN,MANAGER,APPROVER | Ninguno (no hallado) |
| | POST `/api/v1/compliance/invoices/{invoiceId}/cancel` | ADMIN,MANAGER,APPROVER | Ninguno |
| | GET `/api/v1/compliance/invoices/{invoiceId}/audit-trail` | ADMIN,MANAGER,AUDITOR | Ninguno |
| | GET `/api/v1/compliance/invoices/{invoiceId}/versions` | ADMIN,MANAGER,AUDITOR | Ninguno |
| | GET `/api/v1/compliance/invoices/{invoiceId}/status` | EMPLOYEE+ | Ninguno |
| InvoiceController `operation/invoice/controller/InvoiceController.java:21` | GET `/api/v1/purchases` | EMPLOYEE+ | Backoffice (`supplier-invoice.service.ts`) |
| | GET `/api/v1/purchases/{id}` | EMPLOYEE+ | Backoffice |
| | POST `/api/v1/purchases` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/purchases/supplier/{supplierId}` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/purchases/supplier/{supplierId}/transactions` | EMPLOYEE+ | Backoffice (`:47`) |
| | GET `/api/v1/purchases/supplier/{supplierId}/account` | EMPLOYEE+ | Backoffice |
| | POST `/api/v1/purchases/supplier/{supplierId}/payments` | ADMIN,MANAGER | Backoffice |
| PurchaseInvoiceController `operation/invoice/controller/PurchaseInvoiceController.java:22` | POST/GET/PUT/DELETE bajo `/api/purchase-invoices` (create, `/{id}`, list, `/supplier/{id}`, `/supplier-number/{n}`, `/unpaid`, `/supplier/{id}/unpaid`, `/date-range`, `/with-withholding`, `/{id}`, `/{id}/retention`, `/{id}/cancel`, `/{id}`) (**13 endpoints**) | **Sin `@PreAuthorize`** → `authenticated()` | Backoffice `purchase-invoice.service.ts` **con desajuste de ruta** (⚠️1) |
| SalesInvoiceController `operation/invoice/controller/SalesInvoiceController.java:21` | bajo `/api/sales-invoices` (create, `/{id}`, list, `/customer/{id}`, `/sale/{saleId}`, `/customer/{id}/unpaid`, `/date-range`, `/{id}`, `/{id}/payments`, `/{id}/cancel`, `/{id}`) (**11 endpoints**) | **Sin `@PreAuthorize`** → `authenticated()` | Backoffice `sales-invoice.service.ts` **con desajuste de ruta** (⚠️1) |
| QuoteController `operation/quote/controller/QuoteController.java:21` | bajo `/api/quotes` (create, `/{id}`, list, `/customer/{id}`, `/customer/{id}/branch/{branchId}`, `/status/{status}`, `/active`, `/date-range`, `/expiring`, `/{id}`, `/{id}/send`, `/{id}/accept`, `/{id}/reject`, `/{id}/convert-to-sale`, `/{id}`) (**15 endpoints**) | **Sin `@PreAuthorize`** → `authenticated()` | Backoffice `quote.service.ts` **con desajuste de ruta** (⚠️1) |
| SaleController `operation/sales/controller/SaleController.java:15` | GET `/api/v1/sales` | EMPLOYEE+ | Backoffice (`customer-invoice.service.ts`, `sales-data`, `analytics`, `dashboard`) |
| | GET `/api/v1/sales/{id}` | EMPLOYEE+ | Backoffice |
| | POST `/api/v1/sales` | ADMIN,MANAGER | Backoffice |
| | GET `/api/v1/sales/customer/{customerId}` | EMPLOYEE+ | Backoffice |
| | GET `/api/v1/sales/branch/{branchId}` | EMPLOYEE+ | Backoffice |

#### PARTY

| Controller | Método + Path | Seguridad | Frontend |
|---|---|---|---|
| BranchController `party/branch/controller/BranchController.java:20` | GET `/api/v1/branches`; GET `/{id}`; POST `/`; PATCH `/{id}`; DELETE `/{id}`(ADMIN); POST `/{branchId}/locations`; PATCH `/{branchId}/locations/{locationId}`; DELETE `.../locations/{locationId}`(ADMIN); POST `/{branchId}/deposits`; PATCH `/{branchId}/deposits/{locationId}`; DELETE `.../deposits/{locationId}`(ADMIN) (**11**) | EMPLOYEE+ lectura / ADMIN,MANAGER escritura / ADMIN borrado | Backoffice (`branch.service.ts`) |
| CompanyController `party/branch/controller/CompanyController.java:21` | GET `/api/v1/companies`; GET `/{id}`; GET `/{id}/branches`; POST `/{id}/branches`; POST `/`; PATCH `/{id}`; DELETE `/{id}`(ADMIN) (**7**) | EMPLOYEE+ / ADMIN,MANAGER / ADMIN | Backoffice (`company.service.ts`, `branch.service.ts:24,32`) |
| CustomerController `party/customer/controller/CustomerController.java:27` | POST `/`; GET `/search`; GET `/`; GET `/{id}`; PATCH `/{id}`; DELETE `/{id}`(ADMIN); DELETE `/{id}/force`(ADMIN); PATCH `/{id}/restore`; GET `/count`; PUT `/{id}/merge`(ADMIN) bajo `/api/v1/customers` (**10**) | mixto (ver método) | Backoffice (`customer.service.ts`, `sales-data`, `dashboard`) |
| SupplierController `party/supplier/controller/SupplierController.java:24` | GET `/status`; POST `/`; GET `/`; GET `/{id}`; PATCH `/{id}`; DELETE `/{id}`(ADMIN); DELETE `/{id}/force`(ADMIN); PATCH `/{id}/restore`; GET `/count` bajo `/api/v1/suppliers` (**9**) | mixto | Backoffice (`supplier.service.ts`) |

### 5.3 Notas al pie / desajustes detectados (verificados por lectura estática)

- **⚠️1 — Doble prefijo `/api/v1/api/...` en 4 servicios del backoffice.** Los servicios `inventory.service.ts:63`, `purchase-invoice.service.ts:70`, `sales-invoice.service.ts:60` y `quote.service.ts:59` construyen su base como `` `${environment.apiUrl}/api/...` ``, y `environment.apiUrl` ya termina en `/api/v1` (`environment.ts`). Resultado: llaman a `/api/v1/api/inventory`, `/api/v1/api/purchase-invoices`, `/api/v1/api/sales-invoices`, `/api/v1/api/quotes`. Los controllers backend están en `/api/inventory`, `/api/purchase-invoices`, `/api/sales-invoices`, `/api/quotes` (sin `/api/v1`). **Las rutas no coinciden** → probables 404 en runtime (no verificado en ejecución). Además estos 4 controllers son precisamente los que **carecen de `@PreAuthorize`**.
- **⚠️2 — `stock.service.ts` es un stub vacío.** `frontend/web-client/src/app/services/stock.service.ts` declara `_urlBase = .../api/v1/inventory` pero **no tiene métodos**; no consume realmente `InventoryPublicController`. Por eso los endpoints de `InventoryPublicController` quedan como "No determinado".
- **⚠️3 — `transaction.service.ts` apunta a un endpoint inexistente.** `frontend/web-client/src/app/services/transaction.service.ts:13` usa `/api/v1/transactions/supplier/{id}`, pero **no existe** ningún controller en `/api/v1/transactions` (las transacciones de proveedor viven en `InvoiceController` bajo `/api/v1/purchases/supplier/{id}/transactions`). Endpoint frontend huérfano.
- **⚠️4 — Rutas frontend `by-name` sin backend público.** `category.service.ts:79` (`/api/v1/categories/by-name`) y `supplier.service.ts:46` (`/api/v1/suppliers/by-name`) no tienen mapeo público equivalente en los controllers (existe `getByNameOrCreate` pero en los controllers `/internal/**`). Posible desajuste — No determinado si funciona.
- **El Portal (`ecommerce`) consume 0 endpoints** (100% mock, §1.2).

---

## 6. Síntesis de sorpresas / inconsistencias vs. la etiqueta "microservicios"

1. **No hay microservicios en ejecución: es un monolito.** Eureka, Config Server, Gateway y RabbitMQ-event-sync están desactivados por configuración y marcados como *legacy* en el POM padre (`pom.xml:41-46`). El frontend llama directo a `retail-api:9020`.
2. **El `docker-compose.prod.yml` está obsoleto**: despliega gateway+config+eureka+18 `*-sv` comentados y **no incluye `retail-api`** (la app real).
3. **`erp-structure` y `erp-structure-reference` son carpetas vacías** (0 ficheros): estructura ERP objetivo, no código.
4. **4 controllers sin autorización de rol** (`Inventory`, `PurchaseInvoice`, `SalesInvoice`, `Quote`) y con **desajuste de ruta `/api/v1/api/...`** en sus servicios Angular consumidores.
5. **Secretos por defecto hardcodeados y versionados** (JWT `vzxp+...`, `POSTGRES_PASSWORD:root1234`) usados incluso en el perfil `prod`; `.env` local con secretos reales (Gmail/Cloudinary) — aunque `.env` está en `.gitignore`.

---

*Fin del informe FASE 0. Auditoría de solo lectura; no se modificó código fuente.*
