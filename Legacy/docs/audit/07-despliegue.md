# Fase 7 — Auditoría de Despliegue (Railway + Vercel)

> Auditoría **solo lectura**. Verificada contra el código real del repo.
> Convención de citas: `ruta/archivo:línea`.
> Fecha: 2026-07-16.

---

## 0. Resumen del panorama

| Componente | Rol | Plataforma objetivo | ¿Config de deploy? |
|---|---|---|---|
| `retail-api` | Backend monolítico (API real) | Railway | Solo `Dockerfile`, sin `railway.*` |
| `api-gateway` | Gateway Spring Cloud | Railway (opcional) | Solo `Dockerfile` |
| `config-server` | Spring Cloud Config (native) | Railway (opcional) | Solo `Dockerfile` |
| `service-registry` | Eureka | Railway (opcional) | Solo `Dockerfile` |
| `web-client` | Backoffice Angular (pkg `retailmanager`) | Vercel | `vercel.json` ✅ |
| `ecommerce` | Portal Angular (pkg `ecommerce`) | Vercel | **Falta `vercel.json`** ❌ |

Hallazgo central: **`retail-api` está configurado como monolito standalone** y NO
depende de Eureka ni de config-server para arrancar (ver §2.4). Toda la
infraestructura de microservicios (gateway + eureka + config-server) es **peso
muerto para desplegar la API**.

---

## 1. Configuración de deploy existente

### 1.1 Railway — INEXISTENTE

Búsqueda en todo el repo (excluyendo `node_modules`):

- `railway.json` / `railway.toml`: **0 resultados**
- `nixpacks.toml`: **0 resultados**
- `Procfile`: **0 resultados**
- `*.nix`: **0 resultados**

No hay **ninguna** configuración específica de Railway. Lo único que existe para
el backend es:

- 4 `Dockerfile` (uno por microservicio) — ver §2.
- `backend/erphub-api/docker/compose/docker-compose.yml` (dev: solo postgres + rabbitmq).
- `backend/erphub-api/docker/compose/docker-compose.prod.yml` (stack completo pensado para **un VPS con docker-compose**, no Railway).
- `backend/erphub-api/docker/compose/.env.example` documenta las variables de PROD, pero asume `docker compose -f docker-compose.prod.yml up -d` en un servidor propio (`.env.example:5-9`), no Railway.

**Implicación:** Railway puede consumir directamente los `Dockerfile` (build por
imagen), pero no hay orquestación multi-servicio equivalente a compose; en
Railway cada microservicio sería un "service" separado y habría que replicar
manualmente la red interna y el orden de arranque.

### 1.2 Vercel

**`web-client` — `frontend/web-client/vercel.json` (existe, completo):**

- `installCommand: "npm ci"` (`vercel.json:3`)
- `buildCommand: "npm run build:prod"` (`vercel.json:4`) → mapea a `ng build --configuration production` (`package.json:9`)
- `outputDirectory: "dist/retailmanager/browser"` (`vercel.json:5`)
- `cleanUrls: true`, `trailingSlash: false` (`vercel.json:6-7`)
- Rewrite SPA: `filesystem` + `/.* → /index.html` (`vercel.json:8-16`)
- Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (`vercel.json:17-34`) + cache inmutable en `/assets/*` (`vercel.json:35-43`)

**`ecommerce` — NO tiene `vercel.json`** (confirmado: no existe el archivo).
Además `frontend/ecommerce/package.json:4-9` NO define script `build:prod` (solo
`build`, `watch`, `test`). Falta config completa — ver §4.3.

---

## 2. Dockerfiles del backend y viabilidad en Railway

Existe un `Dockerfile` por microservicio (no solo el de postgres):

| Servicio | Ruta | Base JDK | `EXPOSE` | `server.port` real |
|---|---|---|---|---|
| retail-api | `microservices/retail-api/Dockerfile` | temurin **25** | 8080 | **9020** ⚠️ |
| api-gateway | `microservices/api-gateway/Dockerfile` | temurin **21** | 8080 | 8080 (config-server) |
| config-server | `microservices/config-server/Dockerfile` | temurin 25 | 8088 | 8088 |
| service-registry | `microservices/service-registry/Dockerfile` | temurin 25 | 8761 | 8761 |
| postgres | `docker/postgres/Dockerfile` | (imagen postgres) | — | — |

### 2.1 Puerto: `$PORT` de Railway vs `server.port` fijo

**Ningún servicio lee `${PORT}`.** Los puertos están fijos en el YAML:

- `retail-api`: `server.port: 9020` en los 3 perfiles (`application-prod.yml:2`, `application-docker.yml:2`, `application-dev.yml:2`). No hay `${PORT}`.
- `config-server`: `server.port: 8088` (`config-server/.../application.yaml:2`).
- `service-registry`: `server.port: 8761` (`service-registry/.../application.yaml:6`).
- `api-gateway`: sin `server.port` local; lo toma del config-server.

**Bloqueante Railway (menor):** Railway inyecta un `$PORT` dinámico y enruta a
él. Como `server.port` es fijo, hay que **o** setear la variable de entorno
`SERVER_PORT=$PORT` en Railway, **o** cambiar el YAML a `server.port: ${PORT:9020}`.
Sin esto el healthcheck/routing de Railway no encuentra la app.

### 2.2 Inconsistencia `EXPOSE 8080` ≠ `9020` en retail-api

`retail-api/Dockerfile` declara `EXPOSE 8080` pero la app escucha en 9020
(`application-prod.yml:2`). `EXPOSE` es informativo (no bloquea), pero es
señal de que el Dockerfile no está alineado con el puerto real.

### 2.3 Posible bug en el Dockerfile de retail-api

`retail-api/Dockerfile` (etapa build) contiene:

```
RUN ./mvnw -f brand-sv/pom.xml dependency:go-offline -q
```

Referencia a `brand-sv/pom.xml`, módulo que **no se copia** en ese Dockerfile
(solo se copia `retail-api/`). Parece copy-paste de una plantilla. Si el build
de imagen pasa hoy es porque `dependency:go-offline` de ese módulo inexistente
no rompe la etapa siguiente o el `-q` enmascara el error — **no determinado sin
ejecutar el build de Docker**. Debe revisarse antes de un deploy real a Railway.

### 2.4 Viabilidad: ¿retail-api arranca sin Eureka/config-server?

**SÍ, arranca standalone.** Evidencia en código:

- Spring Cloud Config **deshabilitado**: `spring.cloud.config.enabled: false` +
  `import-check.enabled: false` (`retail-api/.../application.yaml:21-25`).
  No hay ningún `spring.config.import: configserver` en retail-api.
- Eureka **deshabilitado** en los 3 perfiles:
  `eureka.client.enabled: false` (`application-prod.yml:57-59`,
  `application-docker.yml:57-59`, `application-dev.yml:57-59`), con comentario
  explícito "No Eureka for monolith".
- `retail-api` **no aparece** en `docker-compose.prod.yml` ni en
  `docker-compose.yml` — no está atado a la orquestación de microservicios.

**Conclusión:** `retail-api` es desplegable como **un único contenedor** en
Railway, sin necesidad de gateway, eureka ni config-server. La arquitectura de
microservicios es opcional/dormida.

Contraste: `api-gateway` SÍ importa config
(`api-gateway/.../application.yaml:4-5`), con default `optional:configserver`
(arrancaría solo), pero el `docker-compose.prod.yml:110` lo fuerza a
**mandatorio** (`SPRING_CONFIG_IMPORT: "configserver:http://config-server:8088"`,
sin `optional:`) y con `depends_on` a config-server + service-registry
(`docker-compose.prod.yml:115-119`). Es decir: desplegar el gateway a Railway
arrastra 2 servicios más.

---

## 3. Conexión a PostgreSQL

### 3.1 retail-api — datasource externalizada (parcialmente)

`application-prod.yml:6-11`:

```
url: jdbc:postgresql://${POSTGRES_HOST:postgres}:${POSTGRES_PORT:5432}/retail_db
username: ${POSTGRES_USER:admin}
password: ${POSTGRES_PASSWORD:root1234}
```

- Host, puerto, usuario y contraseña **sí** están externalizados por env var. ✅
- **Pero el nombre de la base `retail_db` está hardcodeado** en el path de la URL
  (no es variable). El plugin Postgres de Railway expone `PGHOST`, `PGPORT`,
  `PGDATABASE`, `PGUSER`, `PGPASSWORD` (y `DATABASE_URL`). Habría que **mapear**
  esas variables a `POSTGRES_HOST/PORT/USER/PASSWORD` y aceptar el nombre de DB
  que asigne Railway, o crear una DB llamada `retail_db`.
- `ddl-auto: validate` en prod (`application-prod.yml:28`) → el esquema debe
  existir (Flyway lo gestiona: `application.yaml:30-38`, `locations: classpath:db/migration`).

Perfiles no-prod hardcodean host local:
- `application-docker.yml:8` → `jdbc:postgresql://postgres:5432/retail_db` (nombre de servicio compose).
- `application-dev.yml:8` → `jdbc:postgresql://localhost:5544/retail_db`.

### 3.2 config-server / service-registry

No usan datasource (config-server es `native` desde classpath/filesystem,
`config-server/.../application.yaml:6-14`; service-registry es Eureka puro). Sin
conexión a Postgres.

### 3.3 Bases de datos múltiples

`docker/postgres/init/01-create-databases.sql`: **solo se crea `retail_db`**
(línea 23). Las ~18 DBs por microservicio (branch_db, brand_db, …) están
**comentadas** (líneas 5-22). Idéntico en `02-grant-privileges.sql` (solo
`retail_db` activo, línea 23). Confirma el modelo **monolito = una sola base**.

Local (Docker) vs Railway: en local, el `docker-compose.prod.yml:26-43` levanta
un postgres con volumen `postgres_data` y ejecuta los `init/*.sql`. En Railway se
usaría el **plugin Postgres gestionado** (sin `init/` automático), por lo que la
creación de `retail_db` y las migraciones dependen de Flyway al arranque.

---

## 4. Build de producción y despliegue en Vercel

### 4.1 ¿1 proyecto o 2 en Vercel?

El monorepo tiene 2 apps Angular **independientes** (`frontend/web-client` y
`frontend/ecommerce`), cada una con su `package.json`, `angular.json` y
`node_modules`. Encajan mejor como **2 proyectos Vercel separados** (cada uno con
su Root Directory apuntando a su carpeta), no como uno con rutas: tienen
buildCommands, outputs y dependencias distintas (web-client tiene SSR + Material
+ echarts; ecommerce es SPA mínima). El `web-client/vercel.json` ya asume este
modelo (rutas absolutas relativas a su propia carpeta).

### 4.2 web-client (backoffice) — conflicto SSR / static

**El proyecto está configurado para SSR pero se despliega como estático:**

- `angular.json:27-31`: `server: "src/main.server.ts"`, `ssr.entry: "server.ts"`,
  `prerender: false`. → `ng build --configuration production` emite **dos**
  salidas: `dist/retailmanager/browser` **y** `dist/retailmanager/server/server.mjs`.
- Existe `frontend/web-client/server.ts` (Express + `@angular/ssr/node`
  CommonEngine, `server.ts:1-54`) y el script `serve:ssr:retailmanager`
  (`package.json:11`) que corre `node dist/retailmanager/server/server.mjs`.
- **Pero `vercel.json:5` apunta `outputDirectory` a `dist/retailmanager/browser`**
  (solo el bundle de navegador) y hace rewrite SPA a `/index.html`
  (`vercel.json:12-15`). El servidor SSR (`server.mjs`) **nunca se ejecuta** en
  Vercel: no hay Serverless/Edge Function configurada, ni `@angular/ssr` adapter.

**Conclusión del conflicto:** la app **funciona** en Vercel, pero como **SPA
estática pura** — el SSR se compila y se descarta. Para un backoffice (detrás de
login, sin necesidad de SEO) servir estático es la opción **pragmática y
recomendada**, pero el proyecto queda inconsistente: paga el coste de build SSR
sin usarlo. Dos caminos limpios:

1. **Mantener estático** (recomendado): eliminar `server`/`ssr` de
   `angular.json` (o usar un build sin SSR) para no generar `server.mjs` inútil.
2. **SSR real**: desplegar `server.mjs` como Serverless Function (ej. adapter de
   Vercel para Angular SSR / `api/` handler), cambiando `outputDirectory` y
   añadiendo la función. Más complejo; innecesario para un backoffice.

`vercel-build` (`package.json:10`) ya existe como alias de `build:prod`, útil como
hook de Vercel.

### 4.3 ecommerce (portal) — falta toda la config

- **No hay `vercel.json`.** Hay que crearlo.
- Es **SPA pura** (sin SSR: `angular.json` no tiene claves `server`/`ssr`). Más
  simple que web-client.
- `angular.json` **no define `outputPath`** → el builder `@angular/build:application`
  usa el default `dist/ecommerce/browser`. Ese debe ser el `outputDirectory`.
- `package.json:4-9` no tiene `build:prod`; el `defaultConfiguration` es
  `production` (`angular.json`), así que el `buildCommand` sería
  `npm run build` (ya usa production) o `ng build --configuration production`.
- Falta el rewrite SPA (`/.* → /index.html`) y los security headers que web-client
  sí tiene.

**Acción requerida:** crear `frontend/ecommerce/vercel.json` análogo al de
web-client, con `outputDirectory: "dist/ecommerce/browser"`, rewrite SPA y
headers de seguridad.

---

## 5. CORS y URLs hardcodeadas en los frontends

### 5.1 web-client (backoffice)

Consumo **centralizado** vía `environment` (25 archivos lo importan; ej.
`core/http/api.config.ts:2,18-19` → `baseUrl = environment.apiUrl`). No hay
URLs de backend hardcodeadas dispersas en servicios.

**`src/environments/environment.ts` (DEV) — 4 URLs localhost:**

| Línea | Clave | Valor |
|---|---|---|
| `environment.ts:3` | gatewayUrl | `http://localhost:9020` |
| `environment.ts:4` | ecommerceUrl | `http://localhost:4300` |
| `environment.ts:5` | apiUrl | `http://localhost:9020/api/v1` |
| `environment.ts:6` | authUrl | `http://localhost:9020/api/v1/auth` |

Estas **se reemplazan en build de producción** vía `fileReplacements`
(`angular.json:35-39`: `environment.ts` → `environment.prod.ts`). Por tanto
**no rompen prod** por sí solas.

**`src/environments/environment.prod.ts` (PROD) — 3 URLs a dominio placeholder:**

| Línea | Clave | Valor |
|---|---|---|
| `environment.prod.ts:3` | gatewayUrl | `https://api.retailmanager.com` |
| `environment.prod.ts:4` | ecommerceUrl | `https://retail-ecommerce-sigma.vercel.app` |
| `environment.prod.ts:5` | apiUrl | `https://api.retailmanager.com/api/v1` |
| `environment.prod.ts:6` | authUrl | `https://api.retailmanager.com/api/v1/auth` |

**Riesgo real:** `api.retailmanager.com` es un **dominio placeholder** que debe
apuntar a la URL efectiva del backend en Railway (o dominio propio). Si el
backend queda en `*.up.railway.app`, hay que actualizar estas 3 líneas antes de
desplegar. `ecommerceUrl` ya apunta a un deploy Vercel existente del portal.

> Nota: los múltiples `http://www.w3.org/2000/svg` en los `.html` son *namespaces*
> de SVG, no URLs de red — falsos positivos, ignorar.

### 5.2 ecommerce (portal)

- **0 URLs de backend hardcodeadas.** No hay carpeta `environments/`, ni
  `apiUrl`, ni llamadas HTTP reales: los servicios (`core/services/product.service.ts`,
  `tenant.service.ts`, etc.) usan **datos mock** (`core/data/mock-data.ts`).
  `provideHttpClient(withFetch())` está registrado (`app.config.ts:3,11`) pero no
  se usa contra un backend todavía.
- Única dependencia externa de red: Google Fonts en `src/index.html:9-11`
  (`fonts.googleapis.com`). Funciona en Vercel; solo relevante si se aplica una
  CSP estricta.

### 5.3 CORS en el backend

`retail-api` lee orígenes permitidos por env var:

- PROD default: `app.security.cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:https://app.erphub.io,https://erphub.io}` (`application-prod.yml:105-107`).
- Base default (sin perfil): localhost:3000/4200/3001/5173 (`application.yaml:69-72`).

**Acción:** al desplegar, setear `CORS_ALLOWED_ORIGINS` con los dominios Vercel
reales de web-client y ecommerce (los defaults `erphub.io` no coinciden con
`retailmanager.com` del frontend prod → **inconsistencia de dominios** a
reconciliar).

---

## 6. Veredicto por componente

### Backend — `retail-api` (standalone): **desplegable con ajustes MENORES**

Positivo: arranca sin Eureka/config-server (§2.4); datasource externalizada
(§3.1); Flyway gestiona el esquema; CORS por env var.
Bloqueantes a resolver (todos menores):
1. `server.port` fijo 9020 no lee `${PORT}` → setear `SERVER_PORT=$PORT` o
   `${PORT:9020}` (`application-prod.yml:2`).
2. Crear `railway.json`/config o dejar que Railway use el `Dockerfile` (ajustar
   `EXPOSE` a 9020).
3. Revisar la línea `brand-sv/pom.xml` del `retail-api/Dockerfile` (§2.3).
4. Mapear variables del plugin Postgres de Railway a `POSTGRES_HOST/PORT/USER/PASSWORD`
   y garantizar DB `retail_db` (§3.1/§3.3).

### Backend — infra microservicios (gateway + eureka + config-server): **desplegable con ajustes MODERADOS (y probablemente innecesaria)**

Serían 3 servicios adicionales en Railway con dependencias de arranque
encadenadas (`docker-compose.prod.yml:90-119`), sin config Railway, y el gateway
forzado a depender de config-server en prod. **Recomendación:** para el MVP,
desplegar solo `retail-api` standalone y **omitir** gateway/eureka/config-server.
Si se decidiera desplegarlos, el esfuerzo es moderado (orquestación manual,
puertos `$PORT`, red interna Railway).

### Backoffice — `web-client`: **desplegable con ajustes MENORES**

`vercel.json` ya funcional como SPA estático. Ajustes:
1. Actualizar las 3 URLs de `environment.prod.ts` al dominio real del backend
   (§5.1).
2. Decidir SSR: mantener estático (recomendado) y opcionalmente limpiar
   `server`/`ssr` de `angular.json` para no generar `server.mjs` muerto (§4.2).

### Portal — `ecommerce`: **desplegable con ajustes MENORES (falta config)**

SPA pura, 0 URLs de backend hardcodeadas, build OK. Bloqueante único:
1. **Crear `frontend/ecommerce/vercel.json`** con `outputDirectory:
   "dist/ecommerce/browser"`, rewrite SPA y security headers (§4.3).
   Cuando conecte al backend real, añadir una carpeta `environments/` con la URL
   de la API (hoy usa mock data).

---

## Apéndice — Variables de entorno clave para Railway (retail-api)

Derivadas de `application-prod.yml` y `.env.example`:

`SPRING_PROFILES_ACTIVE=prod`, `SERVER_PORT=$PORT`, `POSTGRES_HOST`, `POSTGRES_PORT`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `CORS_ALLOWED_ORIGINS`, `BASE64_SECRET_KEY`,
`JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `MAIL_*` / `BREVO_API_KEY` (si mail
activo), `RESET_PASSWORD_BASE_URL`, `ACCEPT_INVITE_BASE_URL`. RabbitMQ está
**deshabilitado para MVP** (`application.yaml:77-79`), por lo que las vars
`RABBITMQ_*` no son críticas para arrancar.
