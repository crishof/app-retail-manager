# Auditoría de Seguridad — Fase 4

**Repositorio:** `/Users/cristian/proyectos/app-retailmanager`
**Rama:** `mono`
**Fecha:** 2026-07-16
**Alcance:** backend `retail-api` (monolito), `api-gateway`, `config-server`, frontends `web-client` (backoffice) y `ecommerce` (portal).
**Naturaleza:** solo lectura. Verificado leyendo código real. Sin builds ni arranque.

---

## 0. HALLAZGOS CRÍTICOS (resumen al inicio)

| # | Severidad | Hallazgo | Ubicación |
|---|-----------|----------|-----------|
| C1 | **CRÍTICO** | Clave de firma JWT hardcodeada como valor **por defecto en el perfil de producción** (y dev/docker). Si `BASE64_SECRET_KEY` no se exporta en el servidor, se firma con una clave presente en el repo git → permite **forjar tokens JWT** de cualquier usuario/rol/tenant. | `application-prod.yml:85`, `application-dev.yml:77`, `application-docker.yml:77`, `config-server/.../retail-api.yml:77` |
| C2 | **CRÍTICO** | Password de base de datos por defecto `root1234` embebido en archivos versionados (todos los perfiles y todos los configs de microservicios). Default de producción incluido. | `application-prod.yml:10`, `retail-api.yml:14` y ~15 configs más |
| C3 | **ALTO** | Secretos reales en texto plano en `docker/compose/.env` (NO versionado, pero presente en disco): password de app Gmail, API secret de Cloudinary, clave JWT productiva. | `backend/erphub-api/docker/compose/.env:66,70,74-76` |
| C4 | **ALTO** | Clave JWT débil/fija adicional versionada (`MDEy...` = `"0123456789abcdef0123456789abcdef"`), usada como fallback de dev y en `identity-sv-test`. | `JwtService.java:26`, `config/identity-sv-test.yml:20`, `config/retail-api.yml:77` |
| C5 | **MEDIO** | El endpoint público de registro asigna siempre rol `ADMIN`. Registro self-service sin restricción → cualquiera se auto-provisiona como administrador (de su tenant). | `AuthServiceImpl.java:80` + `SecurityConfig.java:107` |

> **Nota sobre endpoints de pago:** el portal `ecommerce` **no tiene integración de pago real** — el checkout es una simulación con datos mock (ver §4). No existe endpoint de pago en el backend, por lo que no hay "endpoint de pago sin validación". Se documenta como riesgo futuro cuando se implemente.

---

## 1. Autenticación / Autorización REAL

### 1.1 Modelo de usuario — un solo modelo (backoffice)

Existe **un único modelo de autenticación** en todo el sistema, en el paquete `auth/` de `retail-api`:

- **`User`** (`auth/model/User.java:20`): identidad (email único, nombre, `role`, `status`, `tenantId`). Tabla `tbl_users`.
- **`SecurityAccount`** (`auth/model/SecurityAccount.java:20`): credenciales, relación 1:1 con `User`; contiene `passwordHash`, `emailVerified`, `enabled`, `locked`. Tabla `tbl_security_accounts`.
- **`Role`** (`auth/model/Role.java:3`): `enum { ADMIN, MANAGER, USER }`.

**El portal (ecommerce) NO tiene modelo de usuario propio ni reutiliza éste.** La entidad `Customer` (`party/customer/model/Customer.java`) es un registro **CRM/de dominio**, sin campo de password ni login (grep de `password|login|credential` en el modelo → 0 coincidencias). No es un principal de autenticación.

**Conclusión:** backoffice y portal **no comparten usuarios** — sencillamente porque el portal no autentica (ver §1.4). El único login real es el del backoffice, sobre `User`/`SecurityAccount`.

### 1.2 Cadena de seguridad (SecurityFilterChain)

`auth/security/config/SecurityConfig.java:87-117`:
- Stateless, sin sesión (`SessionCreationPolicy.STATELESS`, línea 92).
- `@EnableMethodSecurity` (línea 36) → habilita `@PreAuthorize`.
- Autorización por rutas (líneas 104-112):
  - `OPTIONS /**`, `/error/**`, Swagger, `/actuator/health` → `permitAll`.
  - `/api/v1/auth/**`, `/api/v1/registration/**`, `/api/v1/invitations/**` → `permitAll`.
  - `/api/v1/admin/**` y `/actuator/**` → `hasRole('ADMIN')`.
  - **`anyRequest().authenticated()`** (línea 112): todo lo demás exige JWT válido.
- `JwtFilter` insertado antes de `UsernamePasswordAuthenticationFilter` (línea 114).

### 1.3 Validación del JWT

`auth/security/jwt/JwtFilter.java` extrae `Bearer` (línea 71), valida firma/expiración (`isTokenValid`, línea 80), carga `UserDetails` y establece el `SecurityContext`. Además fija `TenantContext` a partir de los claims `tenantId`/`uid` (líneas 84-89) para el aislamiento multi-tenant. `JwtService` usa `jjwt` con HMAC-SHA y `clockSkew` de 30s (`JwtService.java:108-116`). El access token lleva claims `uid`, `role`, `status`, `tenantId` (`JwtService.java:46-50`).

**Autorización a nivel de método:** 27 usos de `@PreAuthorize` en el código. Ejemplos: `AuthController.java:79` (`hasAnyRole('ADMIN','MANAGER','EMPLOYEE')`), `:117` (`/me`).
- **Bug de configuración (bajo):** `@PreAuthorize` referencia el rol `'EMPLOYEE'`, que **no existe** en el enum `Role` (`ADMIN, MANAGER, USER`). El rol `USER` real no puede acceder a `/me`, `/logout-all`, etc. Falla cerrado (deniega), no es explotable, pero es inconsistente.

### 1.4 Portal (ecommerce) — SIN autenticación

`frontend/ecommerce` es un **prototipo/demo 100% mock**:
- No hay servicio de auth, interceptor ni guard; `core/interceptors/` vacío.
- Ningún `.ts` usa `HttpClient`/`fetch`/`/api/` — datos desde `core/data/mock-data.ts`.
- **Checkout anónimo y simulado**: `checkout.component.ts:754` (`confirmOrder`) solo limpia el carrito y muestra un nº de pedido hardcodeado (`#RM-2025-48291`, línea 45). No envía nada al backend.
- Carrito en `localStorage` (`cart.service.ts:6,25`). Ruta `cuenta` sin guard (`ecommerce/app.routes.ts:50`), usuario "Javier Martínez" hardcodeado.

**Implicación:** cuando el portal se conecte a un backend real, deberá definirse el modelo de identidad del cliente y proteger checkout/pedido. Hoy no aplica porque no hay backend detrás.

---

## 2. CORS, CSRF, headers de seguridad y SECRETOS

### 2.1 CORS

- **retail-api** (`SecurityConfig.java:120-132`): CORS por bean. `allowedOriginPatterns` desde `app.security.cors.allowed-origins` (default dev en `application.yaml:72`; prod → `https://app.erphub.io, https://erphub.io` en `application-prod.yml:107`). `allowedHeaders: "*"`, `allowCredentials: true`, `maxAge: 3600`. Correcto: usa lista blanca de orígenes (no `*` con credenciales).
- **api-gateway** (`config/api-gateway.yml:125-140`): `globalcors` con `allowedOrigins: http://localhost:4200` **hardcodeado** y `allowCredentials: true`. En producción el origen sigue siendo localhost salvo override (medio).

### 2.2 CSRF

**Deshabilitado** explícitamente: `SecurityConfig.java:88` (`csrf(AbstractHttpConfigurer::disable)`). Es **correcto** para una API stateless basada en tokens Bearer sin cookies de sesión (no hay superficie CSRF clásica).

### 2.3 Headers de seguridad

- **Backend** (`SecurityConfig.java:98-100`): `X-Frame-Options: DENY` (frameOptions.deny) y **CSP `default-src 'self'`**. No configura HSTS explícito (se delega a TLS/terminador). Aceptable para API.
- **Frontend web-client** (`frontend/web-client/vercel.json:17-34`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. **Falta CSP, HSTS y Permissions-Policy** (medio).
- **Frontend ecommerce**: **sin** `vercel.json`/`netlify.toml`/`_headers`, pese a desplegarse en Vercel (`retail-ecommerce-sigma.vercel.app`). **Ningún header de seguridad** (medio).

### 2.4 SECRETOS en el repositorio

**`.gitignore` cubre** `.env`, `*.env`, `*.key`, `secrets/` (`.gitignore:46-49`), y `docker/compose/.env` **NO está versionado** (verificado con `git ls-files`). Sin embargo:

| Secreto | Archivo:línea | ¿Versionado? | Severidad |
|---------|---------------|--------------|-----------|
| Clave JWT `vzxp+DRFX2QpTbzrY+l0nQ10fs9Cepmc3v5/mslcDno=` (default de prod/dev/docker) | `application-prod.yml:85`, `application-dev.yml:77`, `application-docker.yml:77` | **SÍ** | **CRÍTICO** |
| Clave JWT `MDEy...` (fallback de dev, y default en config-server) | `JwtService.java:26`, `retail-api.yml:77`, `identity-sv-test.yml:20` | **SÍ** | **ALTO** |
| Password DB `root1234` (default prod y de todos los microservicios) | `application-prod.yml:10`, `retail-api.yml:14`, `branch-sv.yml:11`, etc. (~16 archivos) | **SÍ** | **ALTO** |
| Password DB `root1234` (real) | `docker/compose/.env:14` | No (ignorado) | ALTO (disco) |
| Password app Gmail `aeybjdqyssjlpxqy` | `docker/compose/.env:66` | No (ignorado) | **ALTO** (disco) |
| Cloudinary `API_KEY=567147137823941`, `API_SECRET=sV52PDR32NXLfb62dZ7Nh_DRT0A` | `docker/compose/.env:74-76` | No (ignorado) | **ALTO** (disco) |
| Clave JWT real productiva | `docker/compose/.env:70` | No (ignorado) | ALTO (disco) |

**Análisis:** el mayor riesgo es que las **claves por defecto están versionadas** (C1/C2/C4): si el despliegue no exporta las variables de entorno, el sistema arranca con secretos públicos. La misma clave JWT `vzxp+...` que aparece como default en `application-prod.yml` está también en el `.env` real → la clave productiva efectiva está expuesta en el repo. Los secretos de `.env` (Gmail, Cloudinary) no están en git pero sí en texto plano en disco; conviene **rotarlos** (deben considerarse comprometidos) y confirmar que nunca estuvieron en el historial.

**Frontends:** sin secretos reales (verificado). Solo URLs de API en `web-client/src/environments/environment.ts` y `environment.prod.ts` (no son secretos, quedan en el bundle).

### 2.5 config-server

- Perfil `native` que sirve YAML desde `classpath:/config` y `file:/app/config` (`config-server/application.yaml:11-13`). **No hay cifrado de propiedades** (`{cipher}`), no hay backend git remoto: los configs son archivos **versionados** en el repo, con los defaults de secretos ya listados (C2/C4). Sin `encrypt.key` configurada.

### 2.6 api-gateway — ¿valida JWT?

**No.** El gateway (`config/api-gateway.yml:11-19`) es un **passthrough**: enruta `/api/v1/**` → `lb://RETAIL-API` sin filtro de autenticación ni validación de JWT. La autorización se aplica íntegramente aguas abajo en `retail-api` (SecurityFilterChain). Es aceptable siempre que el gateway no exponga otros microservicios sin protección; hoy todas las rutas alternativas están comentadas (líneas 21-123). Nota: en el estado actual, `retail-api` es un monolito con `spring.cloud.config.enabled=false` (`application.yaml:22-24`), por lo que gateway/config-server/eureka parecen infraestructura heredada parcialmente activa.

---

## 3. Hashing de contraseñas

- **Algoritmo: BCrypt.** Bean `PasswordEncoder` → `new BCryptPasswordEncoder()` (`SecurityConfig.java:77-79`). No Argon2.
- Uso: `AuthServiceImpl.java:88` (`passwordEncoder.encode(...)`) al crear la `SecurityAccount`. La verificación se delega al `AuthenticationManager` (`AuthServiceImpl.java:117`).
- **Política de contraseñas** (`shared/validation/PasswordValidator.java`): mínimo 12 caracteres, mayúscula, minúscula, dígito y especial `@$!%*?&`. Robusta.
  - Inconsistencia menor: `LoginRequest` declara `@Size(min=8, max=16)` (`dto/LoginRequest.java`) y `SignupRequest` `min=8, max=72` (`dto/SignupRequest.java`), pero el `PasswordValidator` exige 12 en signup (se aplica en `AuthServiceImpl.java:66`). El límite `max=16` en login podría rechazar passphrases largas legítimas.

### Endpoints de registro
- **`POST /api/v1/auth/registration/signup`** (y alias `/api/v1/registration/signup`): **público** (`SecurityConfig.java:47,51` + `@PreAuthorize("permitAll()")` en `RegistrationController.java:40`). Crea usuario con `Role.ADMIN` (`AuthServiceImpl.java:80`) en estado `PENDING_VERIFICATION` y envía código por email. **Hallazgo C5**: registro self-service que otorga ADMIN. Aceptable si el diseño es "cada registro = dueño de un nuevo tenant"; riesgoso si el registro debiera estar restringido. No hay control de quién puede registrarse.
- Verificación de email por código de 6 dígitos, reenvío, recuperación de password e invitaciones (con rol asignado por un ADMIN, `AuthServiceImpl.java:489`).

---

## 4. Endpoints sin autenticación (permitAll)

Lista de `permitAll` (`SecurityConfig.java:41-63` y matchers 104-109):

| Endpoint | ¿Correcto? |
|----------|-----------|
| `/swagger-ui/**`, `/v3/api-docs/**` | Aceptable en dev; **debería cerrarse en prod** (medio). |
| `/actuator/health` | OK. Resto de `/actuator/**` → `hasRole('ADMIN')` (bien). |
| `/api/v1/auth/login`, `/refresh`, `/logout` | OK (necesarios para autenticarse). |
| `/api/v1/auth/registration/**` (signup, verify, resend) | OK como flujo público, **pero** crea ADMIN (C5). |
| `/api/v1/auth/password/forgot`, `/reset` | OK. |
| `/api/v1/invitations/*/info`, `/accept` | OK (el token de invitación es el secreto). |

**Cobertura por comodín amplia:** los matchers usan `/api/v1/auth/**`, `/api/v1/registration/**`, `/api/v1/invitations/**` (líneas 107-109), más permisivos que la lista `PUBLIC_ENDPOINTS`. Esto abre **cualquier** subruta futura bajo esos prefijos sin autenticación (p.ej. `/api/v1/auth/logout-all` queda `permitAll` en la cadena aunque el método exija rol vía `@PreAuthorize`). Riesgo bajo mientras `@PreAuthorize` cubra los métodos sensibles, pero es una defensa en profundidad debilitada.

**Portal / checkout:** no hay endpoint de checkout/pedido en el backend (el ecommerce es mock, §1.4). El catálogo público que se esperaría (`permitAll` en productos) **no está expuesto**: todo `/api/v1/**` no-auth exige JWT por `anyRequest().authenticated()`. Es decir, hoy no hay catálogo público servido por la API.

**Controladores sin `@PreAuthorize`** (protegidos solo por `authenticated()`, sin granularidad de rol): `SalesInvoiceController`, `PurchaseInvoiceController`, `QuoteController`, `InventoryController`, `CustomerController`. Requieren JWT válido pero **cualquier usuario autenticado** (incluido rol mínimo) puede operarlos. Falta autorización por rol en operaciones de negocio sensibles (medio).

---

## 5. Validación de inputs e inyección

### 5.1 Bean Validation (`@Valid`)

- **Auth:** bien cubierto. Todos los endpoints de `AuthController` y `RegistrationController` usan `@Valid` (`AuthController.java:48,64,104`; `RegistrationController.java:46,71,95`) más validación manual adicional (`ValidationUtil`). DTOs con `@NotBlank/@Email/@Size` (`dto/LoginRequest.java`, `dto/SignupRequest.java`).
- **Controladores de negocio SIN `@Valid`** (los DTOs no se validan): `SaleController.java:36` (`@RequestBody SaleRequest` sin `@Valid`), `CustomerController.java:42` y `:94`, `ProductStockController.java:29,40`. Riesgo: datos malformados llegan a la capa de servicio sin validación declarativa (medio).

### 5.2 Inyección SQL

- **Sin riesgo de SQLi detectado.** Todas las `@Query(nativeQuery=true)` usan **parámetros nombrados** (`:id`, `:name`, `:filter`), nunca concatenación de entrada de usuario. Ejemplos: `BrandRepository.java:18-40`, `ProductRepository.java`, `CustomerRepository.java`, `SupplierRepository.java`.
- El caso con `" + "` (`SupplierPriceItemRepository.java:18-52`) es concatenación de **literales estáticos** para armar el string de la consulta, con los valores de usuario ligados vía `:filter`/`:brand` y `CONCAT('%', :filter, '%')` (líneas 19-21, 29-30). Parametrizado, seguro.
- No se hallaron usos de `createNativeQuery`/`createQuery` con concatenación de variables.

### 5.3 Validación en checkout/pago

No aplica en backend (no existe). En el frontend `ecommerce`, el checkout usa formularios con datos ficticios pre-rellenados (`checkout.component.ts:701-709`) y los campos de tarjeta son placeholders de UI sin integración de pago (`checkout.component.ts:205-222`). **Cuando se implemente pago real, deberá validarse server-side y protegerse con autenticación.**

---

## 6. Recomendaciones priorizadas

1. **(C1/C2/C4) Eliminar todos los defaults de secretos versionados.** Quitar los valores por defecto de `jwt.secret_key` y `spring.datasource.password` en `application-*.yml` y en los configs del config-server; que la app **falle al arrancar** si la variable de entorno no está presente en prod.
2. **(C3) Rotar los secretos reales** de `docker/compose/.env` (Gmail app-password, Cloudinary API secret, clave JWT). Considerarlos comprometidos. Verificar el historial git (`git log --all -- **/.env`) por si alguna vez se comitearon.
3. **(C5)** Revisar la política de registro: si el registro público no debe otorgar ADMIN, cambiar el rol asignado o restringir el endpoint.
4. Añadir CSP/HSTS/Permissions-Policy en `web-client/vercel.json` y crear headers de seguridad para el `ecommerce`.
5. Añadir `@PreAuthorize` por rol a los controladores de negocio (ventas, compras, inventario, clientes) y `@Valid` a sus DTOs.
6. Cerrar Swagger/`v3/api-docs` en producción.
7. Corregir el rol inexistente `EMPLOYEE` en los `@PreAuthorize` (debería ser `USER`).
8. Estrechar los matchers `permitAll` de `/api/v1/auth/**`, `/registration/**`, `/invitations/**` a rutas explícitas.
9. Fijar el CORS del api-gateway por variable de entorno (hoy `localhost:4200` hardcodeado).

---

*Fin del informe — Fase 4.*
