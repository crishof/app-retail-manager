# Seguimiento de Remediación — RetailManager

> Estado vivo de las correcciones derivadas de la auditoría ([00-INFORME_EJECUTIVO](00-INFORME_EJECUTIVO.md)).
> Última actualización: 2026-07-16.

## Leyenda
✅ Hecho · 🔶 Parcial / pendiente de acción externa · ⬜ Pendiente · 🧭 Requiere decisión

---

## R1 — Externalización de secretos (CRÍTICO)

**Estado global: ✅ código corregido · 🔶 rotación pendiente (acción del usuario).**

| Ítem | Estado | Detalle |
|---|---|---|
| Clave JWT productiva `vzxp+...` como default versionado | ✅ | Eliminada de `application-prod/dev/docker.yml`. Prod sin default → arranque falla si falta `BASE64_SECRET_KEY`. |
| Fallback silencioso a clave débil en `JwtService` | ✅ | Nuevo flag `jwt.allow-insecure-fallback` (default `false`). Prod lanza `IllegalStateException` si la clave está vacía. dev/docker lo activan explícitamente. |
| Log que imprimía la clave secreta | ✅ | `log.debug("Building signing key from value...")` eliminado. |
| Password DB `root1234` como default de prod | ✅ | `application-prod.yml` → `${POSTGRES_PASSWORD}` sin default (fail-fast). dev/docker conservan `root1234` (postgres local desechable). |
| Documentación `.env.example` | ✅ | Añadida guía de generación (`openssl rand -base64 32`) y obligatoriedad. |
| Test de verificación | ✅ | `JwtServiceKeyTest` (4 casos). Lógica verificada en aislamiento (ver nota tests abajo). |
| **Rotar secretos comprometidos** | 🔶 **ACCIÓN USUARIO** | La clave `vzxp+...` está en la **historia git** (commit `e611c68e`); tratar como comprometida. Rotar también los secretos reales de `docker/compose/.env` (Gmail app-password, Cloudinary API secret, password DB). Yo no manejo credenciales. |
| **Definir env vars en el deploy** | 🔶 **ACCIÓN USUARIO** | Railway / compose-prod deben exportar `BASE64_SECRET_KEY` y `POSTGRES_PASSWORD`, o el backend no arranca en prod (comportamiento deseado). |

Variables de entorno ahora **obligatorias** en perfil `prod`: `BASE64_SECRET_KEY`, `POSTGRES_PASSWORD`.

---

## Limpieza pendiente (derivada de R1 y de la auditoría)

### L1 — Config-server legacy con secretos versionados ⬜
`microservices/config-server/src/main/resources/config/retail-api.yml` (`:14` `root1234`, `:77` clave `MDEy...`) y ~20 ficheros `*-sv.yml` / `identity-sv-test.yml:20` siguen con defaults de secretos versionados.
- **Riesgo vivo:** bajo — el config-server está **desactivado** (`application.yaml:22-24`, `spring.cloud.config.enabled=false`) y el monolito `retail-api` **no carga** estos ficheros.
- **Acción recomendada:** eliminar el stack Cloud heredado (config-server + eureka + gateway + módulos `*-sv`) o, si se conserva, aplicar el mismo patrón sin defaults. Ver [07-despliegue](07-despliegue.md).

### L2 — Registro público asigna `Role.ADMIN` (C5) 🧭
`auth/service/AuthServiceImpl.java:80` crea todo usuario nuevo como `ADMIN`.
- **Decisión de producto necesaria:** ¿cada registro público = dueño de un nuevo tenant (aceptable), o debe restringirse? No se ha tocado a la espera de esa decisión.
- Ver [04-seguridad](04-seguridad.md) §C5.

### L3 — Tests de factura no compilan ⬜ (chip creado)
`operation/invoice/service/SalesInvoiceServiceTest.java` (y probablemente `PurchaseInvoiceServiceTest.java`) del commit `ca838778` referencian API previa a la refactorización V4:
- `SalesInvoiceRepository.findByIdAndTenantId(UUID, Long)` inexistente.
- `SalesInvoiceResponse.paidAmount(double)` / `getPaidAmount()` inexistentes.
- `InvoiceStatus` tratado como `String` (ahora enum).
- **Impacto:** el módulo de test **no compila** → `mvn test` falla en bloque → bloquea montar CI y ejecutar `JwtServiceKeyTest`. Matiza la conclusión de [06-testing](06-testing-gap.md): esas suites contaban como "reales" pero hoy no son ejecutables.

### Otras recomendaciones de seguridad no bloqueantes (de [04-seguridad](04-seguridad.md) §6)
- ⬜ Añadir CSP/HSTS/Permissions-Policy en `web-client/vercel.json`; headers de seguridad al portal `ecommerce`.
- ⬜ Añadir `@PreAuthorize` por rol y `@Valid` a controladores de negocio (ventas, compras, inventario, clientes).
- ⬜ Cerrar Swagger/`v3/api-docs` en producción.
- ⬜ Corregir el rol inexistente `EMPLOYEE` en `@PreAuthorize` (debería ser `USER`).
- ⬜ Estrechar los matchers `permitAll` `/api/v1/auth/**`, `/registration/**`, `/invitations/**`.
- ⬜ Fijar el CORS del api-gateway por variable de entorno (hoy `localhost:4200` hardcodeado) — solo si se conserva el gateway.

---

## R3 — Arranque en entorno limpio (BLOQUEANTE DEPLOY)

**Estado global: ✅ resuelto y verificado de extremo a extremo.** Detalle: [R3-esquema-arranque](R3-esquema-arranque.md).

Decisiones del usuario: **mono-comercio** (MVP) + **squash** de migraciones.

| Ítem | Estado | Detalle |
|---|---|---|
| **Flyway nunca se ejecutaba** (causa raíz de fondo) | ✅ | Faltaba el módulo `spring-boot-flyway` (autoconfig dividida en Boot 4). Añadido al `pom.xml`. Antes: esquema solo por Hibernate `ddl-auto`, migraciones muertas. |
| Migraciones no materializaban el esquema en BD limpia | ✅ | Squash a `V1__baseline_schema.sql` (42 tablas, generado desde entidades, verificado en Postgres limpio). Eliminadas V1–V4. |
| Namespace `spring.flyway` ignorado | ✅ | Movido bajo `spring:` en `application.yaml`. |
| `ddl-auto` divergente dev/prod | ✅ | `validate` en los tres perfiles; Flyway = única fuente de verdad. |
| Divergencia esquema/código de V4 (`tbl_invoices`, `tbl_invoice_document_types`) | ✅ | Descartada por el squash (sin entidad → no entra al baseline). |
| Listeners AMQP conectan al arrancar sin broker | ⬜ | `Connection refused` si no hay RabbitMQ; `rabbitmq.event-sync.enabled` es propiedad muerta. Revisar para deploy sin RabbitMQ. |

Verificación: BD Postgres 16 vacía → Flyway aplica el baseline (`success=t`) → Hibernate `validate` OK → `Started RetailApi`. Contenedor de prueba aislado y eliminado; no se tocó ninguna BD del usuario.

---

## Preparación de despliegue — bloque "puedo hacer ya" (paso 4)

**Estado: ✅ hecho y verificado (backend compila, backoffice builda).**

| Ítem | Estado | Detalle |
|---|---|---|
| `server.port` fijo no leía `$PORT` | ✅ | `application-prod.yml:2` → `${PORT:9020}` (Railway inyecta el puerto). |
| Dockerfile: referencia inexistente `brand-sv/pom.xml` | ✅ | Corregido a `retail-api/pom.xml` (el build fallaba). |
| Dockerfile: `EXPOSE 8080` desalineado | ✅ | → `EXPOSE 9020`. |
| Dockerfile: `package -DskipTests` compilaba los tests rotos | ✅ | → `-Dmaven.test.skip=true` (no compila tests; la imagen ya no falla por L3). |
| Desajuste de rutas `/api/v1/api/...` (probable 404) | ✅ | 4 servicios Angular del backoffice (sales-invoice, purchase-invoice, quote, inventory) usaban `${apiUrl}/api/...` (doble prefijo). Corregidos a `${gatewayUrl}/api/...` para casar con el backend (que expone `/api/...` sin `/api/v1`). |
| Portal ecommerce sin `vercel.json` | ✅ | Creado `frontend/ecommerce/vercel.json` (SPA rewrite + headers de seguridad; `outputDirectory dist/ecommerce/browser`). |
| Spoofing de `X-Tenant-ID` | ✅ | `TenantFilter` ahora rechaza (403) cualquier `X-Tenant-ID` que no coincida con el tenant del JWT. Seguro: el backoffice deriva ese header del propio JWT (`auth.service.ts:465`), así que las llamadas legítimas casan; solo se bloquea la falsificación. |
| **RabbitMQ tumbaba el arranque/health sin broker** | ✅ **verificado en runtime** | Los componentes AMQP (`RabbitMQConfig`, `BrandEventPublisher`, `BrandEventConsumer`) ahora son `@ConditionalOnProperty("rabbitmq.event-sync.enabled"=true)` → con el flag en `false` (MVP) no se crean y **no hay listener que conecte** al arrancar. `BrandServiceImpl` usa `ObjectProvider` + `ifAvailable` para tolerar la ausencia del publisher. Además se desactivó el health probe de RabbitMQ **y de mail** (`management.health.{rabbit,mail}.enabled=false`) para que `/actuator/health` no dé DOWN sin broker/SMTP. Verificado: BD limpia + sin RabbitMQ → **0 errores AMQP en el arranque**, `/actuator/health` = **200 UP**, ningún componente DOWN. |

**Estandarización de rutas `/api/v1` — ✅ hecho.** Los 4 controllers que colgaban de `/api/...` sin versión se movieron a `/api/v1/...`:
- `InventoryController` `/api/inventory` → `/api/v1/inventory` (coexiste sin colisión con `InventoryPublicController`: uno usa `/sessions|/items`, el otro `/product|/movements`).
- `SalesInvoiceController` `/api/sales-invoices` → `/api/v1/sales-invoices`.
- `PurchaseInvoiceController` `/api/purchase-invoices` → `/api/v1/purchase-invoices`.
- `QuoteController` `/api/quotes` → `/api/v1/quotes`.
Frontend: los 4 servicios vuelven a la convención estándar `${environment.apiUrl}/recurso` (= `.../api/v1/recurso`), igual que el resto. Cadenas de log de los controllers actualizadas también. Los `/internal/*` se dejan como namespace aparte (interno, no API pública).

**Bug latente detectado (no corregido, fuera de alcance):** `JwtFilter.doFilterInternal` invoca `filterChain.doFilter` dos veces en la rama sin token Bearer (una en el `if` de salida y otra en el `finally`) — posible doble ejecución de la cadena. Revisar.

---

## Despliegue del backend en Railway (`railway.json` ✅ preparado y verificado)

Archivo: `backend/erphub-api/microservices/railway.json` (builder Dockerfile, healthcheck `/actuator/health`, restart on-failure).

**Verificado de extremo a extremo (local, simulando Railway):** `docker build` con contexto `microservices/` → OK (imagen 470 MB). La imagen ejecutada con perfil `prod`, `$PORT` y secretos por variable de entorno arranca en ~7 s, **Flyway aplica el baseline** (`v1 baseline schema`), y `/actuator/health` responde **200 UP** sin errores AMQP. Entorno de prueba aislado y eliminado.

**Pasos en Railway (UI):**
1. **New Service → Deploy from repo**, y en *Settings → Root Directory* poner **`backend/erphub-api/microservices`**. Esto es imprescindible: el `Dockerfile` de `retail-api` usa el contexto `microservices/` (copia el parent `pom.xml` y el módulo `retail-api/`). Railway leerá `railway.json` y el `Dockerfile` relativos a ese Root Directory.
2. Añadir un **Postgres** (plugin de Railway) al proyecto.
3. **Variables de entorno** del servicio backend:

| Variable | Valor | Notas |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activa `application-prod.yml`. |
| `BASE64_SECRET_KEY` | *(clave nueva)* | Base64 ≥256 bits: `openssl rand -base64 32`. **Sin ella el backend no arranca** (fail-fast). |
| `POSTGRES_HOST` | `${{Postgres.PGHOST}}` | Referencia a la variable del plugin Postgres. |
| `POSTGRES_PORT` | `${{Postgres.PGPORT}}` | |
| `POSTGRES_USER` | `${{Postgres.PGUSER}}` | |
| `POSTGRES_PASSWORD` | `${{Postgres.PGPASSWORD}}` | **Obligatoria** (fail-fast). |
| `POSTGRES_DB` | `${{Postgres.PGDATABASE}}` | Nombre de la BD (el plugin de Railway suele usar `railway`). Ya externalizado; default `retail_db` si no se define. |
| `CORS_ALLOWED_ORIGINS` | URLs de los frontends en Vercel | Coma-separadas. |
| `MAIL_*`, `CLOUDINARY_*`, `BREVO_API_KEY` | *(si se usan)* | Opcionales para el MVP. |

> El nombre de BD ya está **externalizado** (`${POSTGRES_DB:retail_db}`) en los tres perfiles, así que basta con apuntar `POSTGRES_DB` a la variable `PGDATABASE` del plugin Postgres de Railway — no hace falta crear una BD llamada `retail_db`.

4. `$PORT` lo inyecta Railway automáticamente y el backend ya lo lee (`server.port: ${PORT:9020}`).
5. **Health check**: `railway.json` ya apunta a `/actuator/health` (público, 200 UP). Las sub-rutas `/actuator/health/readiness|liveness` están tras ADMIN (401) — no usarlas como probe sin abrirlas antes.

## Requiere de ti para completar el despliegue
- **URL real del backend en prod**: cuando Railway te dé el dominio, ponerlo en `frontend/web-client/src/environments/environment.prod.ts` (hoy placeholder `https://api.retailmanager.com`).
- **Rotar secretos** comprometidos (ver R1) y definir las variables de arriba en Railway.

---

## Orden del plan (referencia [00-INFORME_EJECUTIVO](00-INFORME_EJECUTIVO.md) §4)

1. ✅ **Seguridad — externalizar secretos (R1).** *Hecho (código); rotación pendiente de usuario.*
2. ✅ **Desbloquear el arranque en entorno limpio (R3).** *Hecho y verificado.*
3. 🧭 Decidir mono- vs multi-comercio antes de tocar el portal.
4. ⬜ Desplegar el vertical que ya funciona (backend + backoffice).
5. ⬜ CI + estabilización backend.
6. ⬜ Construir el ecommerce real (carrito → Order → checkout → pago).
7. ⬜ Fase Verifactu (reorientar fiscal a España).
8. ⬜ Unificación de diseño (Tailwind/design system).
