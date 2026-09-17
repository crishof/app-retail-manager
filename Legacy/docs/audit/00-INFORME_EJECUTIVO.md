# Informe Ejecutivo — Auditoría RetailManager

> **Fecha:** 2026-07-16 · **Alcance:** diagnóstico exhaustivo, **solo lectura** (no se modificó código).
> **Documentos de detalle:** [00-arquitectura](00-arquitectura.md) · [01-backend](01-backend-codigo-huerfano.md) · [02-frontend](02-frontend-huerfanos-y-visual.md) · [03-multitenancy](03-multitenancy-gap.md) · [04-seguridad](04-seguridad.md) · [05-verifactu](05-verifactu-gap.md) · [06-testing](06-testing-gap.md) · [07-despliegue](07-despliegue.md)
>
> Cada hallazgo está referenciado a archivo:línea. Lo que no pudo verificarse con certeza se marca **"No determinado"**.

---

## 0. Corrección de premisas del encargo

La auditoría partió de un conjunto de asunciones que **el código contradice**. Es el hallazgo transversal más importante: el proyecto está **bastante más avanzado y en un estado distinto** al que describe el prompt. Confirmado leyendo el repo:

| Asunción del encargo | Realidad verificada | Evidencia |
|---|---|---|
| Monolito Java/Spring | **Monolito modular DDD**, con andamiaje de microservicios (Eureka, Config Server, Gateway, RabbitMQ) presente pero **marcado *legacy* y desactivado** | `microservices/pom.xml:41-46`; `retail-api/.../application.yaml:21-25` ("Monolith Activation") |
| Actualizar a Java 25 / Spring Boot 4 "en fase posterior" | **Ya está hecho:** Java 25, Spring Boot 4.0.6, Spring Cloud 2025.1.1 | `microservices/pom.xml` |
| Dos apps Angular | **Tres** carpetas: `web-client` (backoffice), `ecommerce` (portal), `erp-structure` (**vacía**, no es app) | `frontend/` |
| Tailwind "en fase posterior, a ambas" | El backoffice **ya tiene** Tailwind 3.4.19 + `design-tokens.css` (aunque casi sin usar) | `web-client/tailwind.config.js` |
| No hay tenancy, "se parte de cero" | Tenancy **parcial pero no cableada** (andamiaje inacabado); aislamiento efectivo ~nulo | `db/migration/V1__Add_tenant_multi_tenancy_support.sql`; `shared/tenancy/` |
| Facturación española es necesidad futura | Existe capa fiscal/facturación... pero **orientada a Argentina (AFIP/CUIT)**, no España | `shared/fiscal/TaxComplianceService.java`, `TaxRegime.java` |
| No hay tests | **Falso:** ~11 archivos de test backend (~176 `@Test`), incluidas suites reales de facturación | `retail-api/src/test/**`; commit `ca838778` |

**Implicación:** varias "fases posteriores" del roadmap original ya no son *green-field*. Hay que **auditar y corregir lo existente** (tenancy a medias, fiscal argentino, deuda de esquema) antes que construir de cero.

---

## 1. Resumen ejecutivo

**Estado general.** RetailManager es un **monolito modular Spring Boot 4 / Java 25** (`retail-api`) razonablemente estructurado por dominio (catálogo, inventario, operaciones, party, fiscal, auth), con **~197 endpoints REST en 31 controllers** y un **backoffice Angular 21 funcionalmente maduro** que consume la mayoría de ellos. Los tres artefactos compilan hoy (backend `mvn compile`, `web-client` build prod, `ecommerce` build — todos exit 0). **Pero** el sistema **no está listo para producción** por tres motivos estructurales: (a) **secretos de producción hardcodeados y versionados**, (b) **multitenancy declarada pero no aplicada** (fuga total de datos entre comercios), y (c) **el "ecommerce integrado" es un prototipo 100 % mock** que ni siquiera llama al backend.

**Riesgo de madurez ecommerce vs backoffice (crítico para el producto).** Existe una **asimetría severa**: el backoffice es una aplicación real y conectada; el **portal ecommerce no consume la API en absoluto** — datos mock, checkout simulado, selector de tienda falso ([02](02-frontend-huerfanos-y-visual.md), [00](00-arquitectura.md)). Para un producto cuyo diferencial es "gestión comercial **con ecommerce integrado**", **la mitad de valor (el ecommerce) está esencialmente sin construir en su capa funcional**. Este es el mayor gap de negocio.

### Top 5 riesgos

| # | Riesgo | Severidad | Evidencia |
|---|---|---|---|
| **R1** | **Secretos de producción versionados.** Clave de firma JWT como *default de prod*; password DB `root1234`; registro público que asigna `Role.ADMIN`. Cualquiera con el repo puede forjar tokens de admin. | 🔴 **CRÍTICO** | `application-prod.yml:85`, `:10`; `JwtService.java:26`; `AuthServiceImpl.java:80` |
| **R2** | **Multitenancy no aplicada → fuga total de datos.** El `tenantId` se estampa pero **no se filtra**; los controladores leen `X-Tenant-ID` del cliente **sin validar contra el JWT** (spoofing). 26/30 controllers ignoran el tenant. | 🔴 **CRÍTICO** (si hay >1 comercio) | `SalesInvoiceServiceImpl.java:60-74`; `QuoteController.java:34`; `ProductRepository.java:18` |
| **R3** | **El backend no puede materializar su esquema en un entorno limpio.** `prod` usa `ddl-auto: validate` pero **no hay `CREATE TABLE` base** en las migraciones Flyway; además `flyway:`/`rabbitmq:` están fuera del namespace `spring:` → config ignorada. Arranque en DB nueva = fallo. | 🔴 **Bloqueante deploy** | `application-prod.yml:28`; `application.yaml:30,77` |
| **R4** | **El ecommerce es fachada.** 0 endpoints consumidos, checkout simulado, sin carrito ni módulo Order en backend, sin pasarela de pago. | 🟠 **Importante** (bloqueante de producto) | `checkout.component.ts:754`; [01](01-backend-codigo-huerfano.md) |
| **R5** | **Capa fiscal orientada a Argentina, no a España; e inmutabilidad en la factura equivocada.** Verifactu (huella encadenada, QR, AEAT) = gap casi total; la maquinaria de inmutabilidad se aplica a la factura de **compra**, no a la de **venta**. | 🟠 **Importante** (gap regulatorio futuro) | `TaxComplianceService.java`; `DocumentVersioningService` (`calculateHash:292`); [05](05-verifactu-gap.md) |

### Esfuerzo relativo por área (orientativo)

| Área | Estado | Esfuerzo para MVP desplegado |
|---|---|---|
| Backend (dominio `retail-api`) | Maduro, con deuda | **Medio** — corregir esquema/config, transacciones, limpiar duplicados |
| Seguridad | Base sólida (BCrypt, JWT, CORS) pero con fugas graves | **Bajo-Medio** — externalizar secretos, cerrar registro ADMIN, validar tenant |
| Multitenancy | Andamiaje inacabado | **Alto** — cablear filtrado automático y cerrar fugas |
| Backoffice (web-client) | Maduro funcional, caótico en estilo | **Bajo** para desplegar; **Medio** para unificar diseño |
| Portal ecommerce | Prototipo mock | **Muy alto** — conectar a API, carrito, checkout, pago (funcionalidad nueva) |
| Infra/Deploy | Sin config Railway; monolito desplegable | **Bajo-Medio** — `$PORT`, esquema, quitar microservicios muertos |
| Testing | Tests backend reales sin CI; fronts sin tests | **Bajo** para CI; **Medio** para cobertura de flujos críticos |
| Facturación Verifactu | Base fiscal argentina; gap España | **Alto** (fase futura, sin clientes hoy) |

---

## 2. Checklist — Qué está completo hoy

- ✅ **Backend monolito modular** por dominios, compila con Java 25 / Spring Boot 4.0.6 ([00](00-arquitectura.md)).
- ✅ **~197 endpoints REST** en 31 controllers; el backoffice consume la mayoría ([00](00-arquitectura.md)).
- ✅ **Autenticación real del backoffice**: JWT (jjwt/HMAC), Spring Security stateless, **BCrypt** con política de contraseñas de 12+ caracteres, roles ADMIN/MANAGER/USER, guards por rol en Angular ([04](04-seguridad.md)).
- ✅ **CORS con lista blanca**, CSRF correctamente deshabilitado para API stateless, cabeceras `X-Frame-Options`/CSP en backend ([04](04-seguridad.md)).
- ✅ **Sin SQL injection**: todas las native queries usan parámetros nombrados ([04](04-seguridad.md)).
- ✅ **Backoffice Angular 21 maduro**: CRUD de catálogo, inventario, facturación, clientes, proveedores, presupuestos; 0 componentes/servicios huérfanos en el portal ([02](02-frontend-huerfanos-y-visual.md)).
- ✅ **Migraciones Flyway V1–V4** y esquema de auditoría/versionado con SHA-256 por snapshot ([05](05-verifactu-gap.md)).
- ✅ **Tests de facturación reales** (Sales/PurchaseInvoice, ~1.189 líneas, commit `ca838778`) + suites de inventario, quotes, fiscal y aislamiento ([06](06-testing-gap.md)).
- ✅ **`web-client/vercel.json`** completo (SPA rewrite + cabeceras de seguridad); los 3 builds pasan ([07](07-despliegue.md)).
- ✅ **retail-api arranca standalone** (Eureka/Config/Gateway desactivados) — el deploy no requiere el stack Cloud ([07](07-despliegue.md)).

---

## 3. Checklist — Qué falta para MVP funcional desplegado

Severidad: 🔴 Bloqueante · 🟠 Importante · 🟢 Deseable. "Dep." = depende de.

### Seguridad
- 🔴 **Externalizar todos los secretos** y eliminar defaults de prod versionados (JWT, `root1234`). Rotar claves. `application-prod.yml:85,:10`, `JwtService.java:26`, `retail-api.yml`.
- 🔴 **Cerrar el registro público que asigna `Role.ADMIN`** — `AuthServiceImpl.java:80`.
- 🟠 Añadir CSP/HSTS a `web-client/vercel.json`; cabeceras de seguridad al portal (hoy ninguna).
- 🟠 Añadir `@Valid`/`@PreAuthorize` a controladores de negocio sin protección (incl. `Inventory`, `PurchaseInvoice`, `SalesInvoice`, `Quote`) ([00](00-arquitectura.md), [04](04-seguridad.md)).

### Backend / datos
- 🔴 **Arreglar la materialización del esquema**: mover `flyway:`/`rabbitmq:` bajo `spring:` (`application.yaml:30,77`) y proveer las migraciones `CREATE TABLE` base, o cambiar la estrategia `ddl-auto` en prod (`application-prod.yml:28`). *Sin esto, el backend no levanta contra una DB limpia.* **Dep. de deploy.**
- 🟠 **Envolver en `@Transactional`** las escrituras multi-paso (`CashServiceImpl.openSession:43,67,81`; Branch/Company) ([01](01-backend-codigo-huerfano.md)).
- 🟠 **Resolver la duplicación de dominio de factura de compra** (`Invoice`/`/api/v1/purchases` vs `PurchaseInvoice`/`/api/purchase-invoices`), ambos vivos ([01](01-backend-codigo-huerfano.md)).
- 🟢 Eliminar código muerto: `TenantOnboardingService`, ruta de stock paralela (`ProductStockController`), entidades `ProductPrice`/`BrandProjection`, endpoints `/audit-trail` y `/versions` que devuelven **mock** ([01](01-backend-codigo-huerfano.md), [05](05-verifactu-gap.md)).

### Multitenancy (bloqueante solo si el MVP es multi-comercio)
- 🔴/🟠 **Decidir si el MVP es mono o multi-comercio.** Si multi: cablear filtrado automático (Hibernate `@TenantId`/filter o `@Where`), derivar el tenant del **JWT** y no de `X-Tenant-ID`, y añadir `tenant_id` a las tablas que faltan (Company, Branch, line-items, precios, caja, stock-movements). **Dep. de decisión de producto** ([03](03-multitenancy-gap.md)).
- ❓ **No determinado:** modelo de tenancy del portal (subdominio-por-comercio vs dominio único con selector). Hoy es un selector 100% mock (`tenant.service.ts:14`).

### Backoffice
- 🟠 Actualizar la URL de API de producción (placeholder `api.retailmanager.com` en `environment.prod.ts`) al backend real ([07](07-despliegue.md)).
- 🟠 **Corregir el desajuste de rutas** `${apiUrl}/api/...` → `/api/v1/api/...` en varios servicios Angular vs backend `/api/...` (probables 404 en runtime; **no verificado en ejecución**) ([00](00-arquitectura.md)).
- 🟢 Decidir sobre SSR (config activa pero descartada por Vercel) y unificar el caos de estilos (3 sistemas: Bootstrap/jQuery declarados sin usar, Tailwind sin adoptar, 25 rutas `EnConstruccionComponent`) ([02](02-frontend-huerfanos-y-visual.md), [07](07-despliegue.md)).

### Portal ecommerce (bloqueante de producto)
- 🟠 **Conectar el portal al backend**: hoy no inyecta `HttpClient`, no tiene `environment.ts`, y el checkout solo limpia el carrito con nº de pedido hardcodeado (`checkout.component.ts:754`). Requiere carrito real, **módulo Order en backend** (inexistente) y **pasarela de pago** (inexistente) ([00](00-arquitectura.md), [01](01-backend-codigo-huerfano.md)).
- 🟠 Crear su `vercel.json` y script `build:prod` (no existen) ([07](07-despliegue.md)).

### Infra / Deploy
- 🔴 **`server.port` fijo (9020) no lee `${PORT}`** de Railway (`application-prod.yml:2`); `Dockerfile` con `EXPOSE 8080` desalineado y una línea sospechosa `brand-sv/pom.xml` ([07](07-despliegue.md)).
- 🟠 No hay config Railway (`railway.json/toml`, `nixpacks`, `Procfile`); `docker-compose.prod.yml` **no incluye `retail-api`** (la app real) ([07](07-despliegue.md)).
- 🟢 Eliminar del deploy Gateway/Eureka/Config Server (peso muerto para el MVP) ([00](00-arquitectura.md), [07](07-despliegue.md)).

### Testing
- 🟠 **Crear CI** (no existe `.github/workflows`) para ejecutar las suites backend ya escritas, hoy huérfanas; hacerlas independientes de una DB local ([06](06-testing-gap.md)).
- 🟢 Cubrir los flujos críticos sin test: venta/pedido, caja/TPV, login, importación de catálogo, pricing, stock-movements ([06](06-testing-gap.md)).

### Facturación (fase futura, sin clientes hoy)
- 🟢 **Verifactu:** gap casi total (encadenamiento hash anterior→actual, firma, QR, remisión AEAT, NIF emisor, desglose IVA español 21/10/4). Reorientar la capa fiscal de AFIP a España y aplicar la inmutabilidad a la factura de **venta** ([05](05-verifactu-gap.md)).

---

## 4. Orden recomendado de abordaje (fase de refactor)

1. **Seguridad primero (días, no semanas).** Externalizar y rotar secretos, cerrar el registro→ADMIN. Es barato y elimina el riesgo crítico R1 antes de exponer nada.
2. **Desbloquear el arranque en entorno limpio (R3).** Arreglar namespace `spring:`/Flyway y las migraciones base. Sin esto no hay deploy verificable.
3. **Decidir mono- vs multi-comercio ANTES de tocar el portal.** Esta decisión cambia el modelo de URLs/dominios del ecommerce (subdominio vs selector), el esquema (`tenant_id` en más tablas) y la resolución de tenant. Definirla tarde obliga a rehacer routing y datos. Si el MVP es **mono-comercio**, se puede aparcar el filtrado y solo hay que **impedir el spoofing de `X-Tenant-ID`**; si es **multi**, cablear el aislamiento automático es prerrequisito de todo lo demás.
4. **Desplegar el vertical que ya funciona (backend + backoffice)** a Railway/Vercel: `$PORT`, URL de API real, corregir el desajuste `/api/v1/api`. Consigue un MVP interno demostrable pronto.
5. **CI + estabilización backend** (transacciones, eliminar dominios/rutas duplicados y código mock). Aprovechar los tests ya existentes.
6. **Construir el ecommerce de verdad** (carrito → módulo Order → checkout → pasarela de pago). Es la mayor inversión funcional; hacerlo después de fijar tenancy y seguridad.
7. **Fase Verifactu** cuando haya clientes españoles reales: reorientar fiscal a España y encadenamiento/AEAT.
8. **Unificación de diseño (Tailwind/design system)** como capa transversal final: backoffice esfuerzo **medio**, portal **alto**; los tokens divergen hoy (teal `#0d9488` + azul `#3b82f6` en backoffice; verde `#1a6b3a` en portal), así que un design system común requiere decisión de marca previa ([02](02-frontend-huerfanos-y-visual.md)).

---

## 5. Nota sobre método y limitaciones

- **Solo lectura:** no se modificó ningún archivo de código; solo se generaron los 9 documentos en `docs/audit/`.
- **Builds verificados** (compilación); **arranque en runtime NO verificado** — los hallazgos de "probable 404" y "no materializa esquema" son análisis estático, marcados como tales.
- Los informes de auditoría previos del repo (`ANALISIS_*.md`, `FRONTEND_*.md`, ~junio 2026) se trataron como **pistas a verificar**, no como fuente de verdad.
- Hallazgo colateral: `shared/audit/AuditService.java` aparece **modificado sin commitear** en el working tree; se auditó tal cual está en disco.
