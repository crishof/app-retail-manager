# Plan de desarrollo — RetailManager

**Fecha base:** 2026-08-07 · **Rama:** `mono` · **Último commit:** `90a73728`
**Reemplaza a** `docs/plans/PLAN_DESARROLLO_POR_BLOQUES.md`, obsoleto (describe como greenfield los Bloques 1-7 que ya están implementados y desplegados).
**Fuentes:** los 9 informes de `docs/audit/` (foto "antes"), `docs/audit/REMEDIACION.md` (delta "después"), y verificación directa contra el código, la base desplegada y los dos repos el 2026-08-07.

---

## Context

RetailManager llega a este punto tras una auditoría de 9 informes (`docs/audit/`) y una ronda de remediación ya aplicada (commit `90a73728`, hoy). El objetivo de este plan es llevar el sistema desde su estado actual —**ya desplegado y vivo, pero sin red de seguridad y con un agujero de privilegios abierto**— hasta un MVP operable y endurecido, y de ahí a producto completo.

Este plan no es una refactorización: es la secuencia de trabajo. Su premisa central es que el sistema **ya está en internet**, y eso invierte las prioridades habituales: contener antes que construir, y medir antes que tocar.

### Estado real verificado hoy (no asumido)

**Arquitectura.** No son microservicios: es un **monolito modular DDD** `retail-api` (Java 25, Spring Boot 4.0.6) en `backend/erphub-api/microservices/retail-api`. Gateway, Eureka y config-server existen en el repo pero están desactivados — son peso muerto.

**Ya desplegado y funcionando** (verificado con `curl` hoy):
- Backend en Railway → `/actuator/health` = 200 UP, `/v3/api-docs` = 200, endpoints protegidos = 401.
- `frontend/web-client` (backoffice) → `retail.zaphirio.com` = 200. `environment.prod.ts` ya apunta a la URL real.
- CORS operativo para ambos orígenes de producción; cabeceras de seguridad básicas presentes en backend.
- La API expone **144 rutas en 27 grupos**. **No existe `/api/v1/orders`** ni integración de pago alguna.

**Ya remediado** (commit `90a73728`): secretos externalizados con fail-fast; Flyway —que **nunca se había ejecutado** por falta del módulo `spring-boot-flyway` en Boot 4— corregido y verificado contra Postgres limpio, con squash a `V1__baseline_schema.sql`; despliegue Railway/Vercel; rutas estandarizadas a `/api/v1/*`; `TenantFilter` rechaza con 403 el spoofing de `X-Tenant-ID`.

**Lo que sigue roto y condiciona todo el plan:**
- **`mvn test` falla en compilación.** Dos ficheros de test rompen la fase `test-compile`, lo que **aborta el módulo entero**: los ~176 `@Test` existentes no se ejecutan nunca. No hay cobertura baja; hay cobertura **cero efectiva**.
- **No existe CI.** No hay `.github/workflows/`.
- **Agujero de privilegios abierto en producción:** el registro público asigna `Role.ADMIN` a cualquiera.
- Bug de doble ejecución de la cadena de filtros; 23/49 servicios sin `@Transactional`; dominio de factura de compra duplicado; RBAC ausente en 4 controllers de negocio.
- **El aislamiento por tenant está declarado pero no cableado:** 35 repositorios extienden `TenantAwareRepository` y **ningún servicio invoca `withTenant(...)`**. Las consultas de catálogo cruzan tenants hoy.

**El portal real está fuera de este repo.** `web-hoffmann` (repo separado) es un ecommerce completo y desplegado —storefront Angular 22 con SSR, panel de 26 pantallas, y un BFF Java de 641 ficheros con 74 tests y 44 migraciones— que hoy funciona contra un ERP externo de terceros ("Heaven") y está preparado, por diseño, para que `retail-api` ocupe ese lugar. Tampoco tiene CI, y su árbol de trabajo está sin commitear.

### Decisiones de producto ya tomadas (2026-08-07)

| Decisión | Resolución | Consecuencia en el plan |
|---|---|---|
| **Portal ecommerce** | **Se descarta `frontend/ecommerce` por completo.** El portal real es `web-hoffmann`, **repo separado que sigue separado** | No hay fase "construir el ecommerce" ni módulo Order en `retail-api` |
| **Integración con el portal** | **Diferida hasta que RetailManager funcione correctamente por sí mismo.** En ese momento se añadirán los endpoints que `web-hoffmann` necesite y su adaptación a multitenant | La convergencia sale de la ruta crítica y pasa a **Fase 5 (futura)**. El objetivo de producto pasa a ser el vertical backend + backoffice, completo y sólido |
| **Multitenancy del portal** | **Futura**, junto con la integración | Sale de la Fase 4; se trata como parte de la Fase 5 |
| **Registro y roles** | **Solo por invitación.** Signup público cerrado; altas por el flujo `/api/v1/invitations` ya existente | Desbloquea T0.3 |
| **Modelo de autorización** | **Permisos granulares por recurso y acción** (caja, stock, facturación, configuración…), no el enum plano de 3 roles actual | Cambio estructural: sustituye a las tareas de `@PreAuthorize` puntuales. Backend en Fase 1, gestión desde el backoffice en Fase 3 |
| **Factura de compra** | **Gana `Invoice` / `tbl_supplier_invoice`**, que absorbe el buen diseño de `PurchaseInvoice`; este último se retira | Decisión revisada sobre evidencia: `PurchaseInvoice` es mejor código pero está desconectado y su IVA es **español** (`'0'\|'7'\|'21'`), resto del intento de reorientar a España ya descartado. Ver Fase 2 |
| **Fiscalidad** | **Argentina, se mantiene AFIP.** Verifactu descartado | Se elimina toda la fase Verifactu; se consolida la capa fiscal argentina existente |
| **Pago** | Pedido con **pago diferido** (transferencia / en tienda), sin pasarela | Se decidió pensando en el portal descartado, así que queda en gran medida superada: el portal real **ya tiene** transferencia con validación de CBU y confirmación manual desde el panel, y además webhook de Mercado Pago con firma verificada (hoy inactivo por credenciales sin configurar). `retail-api` no necesita nada de esto |

### Escalas

**Esfuerzo:** S ≤ 0,5 día · M = 1-2 días · L = 3-5 días · XL > 1 semana
**Marcas:** `[CÓDIGO]` desarrollo · `[USUARIO]` acción de plataforma, credenciales o decisión

---

## Mapa de fases

| Fase | Objetivo | Duración orientativa | Bloquea a |
|---|---|---|---|
| **0** | Contención de producción + red de seguridad (CI verde) | 3-5 días | Todas |
| **1** | Endurecimiento del backend + modelo de permisos granulares | 2-3 semanas | 2, 3 |
| **2** | Consolidación del dominio de factura | 1-2 semanas | 3 |
| **3** | **Completitud funcional**: RetailManager operable de punta a punta | 6-10 semanas | 5 |
| **3-bis** | Retirada del prototipo de ecommerce | 1 día | — |
| **4** | Escala y cumplimiento (multitenancy, fiscal AFIP, observabilidad, design system) | reactiva | 5 |
| **5** | *(Futura)* Integración con el portal `web-hoffmann` + multitenancy del portal | diferida | — |
| **T** | Vía transversal de deuda | continua, oportunista | — |

**Hito MVP operable** = fin de Fase 1.
**Hito producto completo** = fin de Fase 3 — y aquí "producto" significa **el vertical backend + backoffice**, no el ecommerce.
**Fase 4 es reactiva:** cada bloque se activa por un disparador de negocio concreto.
**Fase 5 está diferida por decisión explícita:** no se toca hasta que RetailManager funcione correctamente por sí mismo. Se documenta para que las Fases 1-3 no tomen decisiones que la hagan imposible, no para ejecutarla ahora.

---

# FASE 0 — Contención y red de seguridad

**Objetivo:** cerrar el agujero de privilegios de un sistema que ya está expuesto, y conseguir que `mvn test` pase para que exista señal de regresión antes de tocar nada más.

## 0.A — Contención de producción (P0, inmediato)

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T0.1** | Rotar `BASE64_SECRET_KEY` en Railway. La clave está en la historia git (`e611c68e`): cualquiera con el repo puede forjar JWTs con `role=ADMIN` y `tenantId` arbitrario. Invalida los tokens vivos (los usuarios re-loguean) | Variables de entorno Railway | **P0** | S | `[USUARIO]` |
| **T0.2** | Rotar Gmail app-password y credenciales Cloudinary | Google Account / Cloudinary | **P0** | S | `[USUARIO]` |
| **T0.3** | **Cerrar el registro público.** Quitar `setRole(Role.ADMIN)` y pasar `/api/v1/registration/**` a acceso restringido; las altas van por el flujo de invitaciones ya existente. Primer admin por seed o variable de entorno | `auth/service/AuthServiceImpl.java:80`, `auth/security/config/SecurityConfig.java:107-109` | **P0** | S-M | `[CÓDIGO]` |
| **T0.4** | Auditar la BD de producción: listar usuarios y roles, detectar ADMINs creados por el registro abierto, revocar los espurios | Postgres de Railway | **P0** | S | `[USUARIO]` |
| **T0.5** | Cerrar Swagger en prod. Requiere **tres** cambios coordinados: `SecurityConfig.java:106`, `JwtFilter.PUBLIC_PATHS` (líneas 32-33) y `springdoc.*.enabled=false` en el perfil `prod`. Mantener abierto en `dev` | `SecurityConfig.java`, `JwtFilter.java`, `application-prod.yml` | **P1** | S | `[CÓDIGO]` |
| **T0.6** | Backup automático y **probado** de la BD de Railway. Hoy no hay red bajo el dato de producción | Railway | **P1** | M | `[USUARIO]` |

> **Nota sobre T0.1:** rotar la clave es la mitigación real de la exposición histórica. Reescribir la historia de git no aporta nada una vez la clave está comprometida, y rompe a todo el que tenga un clon.

## 0.B — Red de seguridad

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T0.7** | **Reparar la compilación de los tests de factura.** Dos errores exactos en `SalesInvoiceServiceTest.java` y `PurchaseInvoiceServiceTest.java`: (1) invocan `findByIdAndTenantId(UUID, Long)`, inexistente en `SalesInvoiceRepository`/`PurchaseInvoiceRepository`; (2) usan `.paidAmount(...)` en los builders de los DTOs de respuesta, cuyo campo real es `amountPaid` | `src/test/java/.../operation/invoice/service/` | **P0** | S-M | `[CÓDIGO]` |
| **T0.8** | Pipeline CI en `.github/workflows/ci.yml`: job backend (JDK 25, `mvn -B verify` con Postgres de servicio para validar Flyway + `ddl-auto: validate`) y job frontend (`npm ci && npm run build && npm test`) para `web-client` | `.github/workflows/ci.yml` | **P0** | M | `[CÓDIGO]` |
| **T0.9** | Job que arranca el contenedor Docker contra Postgres limpio y verifica `/actuator/health` = UP. Es el único test que habría cazado la regresión de Flyway | `.github/workflows/ci.yml` | P1 | M | `[CÓDIGO]` |
| **T0.10** | Protección de rama `mono`: CI verde obligatorio para merge | Ajustes de GitHub | P1 | S | `[USUARIO]` |
| **T0.11** | Jacoco con umbral **inicial bajo** (~25% en `operation` y `auth`) y `fail-on-violation`. El umbral sube cada fase; nunca baja | `pom.xml` | P2 | S | `[CÓDIGO]` |

### Detalles concretos del CI (verificados)

- El wrapper `mvnw` está en `backend/erphub-api/`, pero el POM reactor está un nivel más abajo, en `microservices/pom.xml`. El workflow debe invocar `./mvnw -f microservices/pom.xml`.
- Ese POM padre **sigue declarando los 3 módulos legacy** (`api-gateway`, `config-server`, `service-registry`). El CI debe construir solo `-pl retail-api`, o bien sacarlos de `<modules>` (ver TT.1).
- El Dockerfile usa `-Dmaven.test.skip=true` precisamente para esquivar los tests rotos. **Tras T0.7 hay que revertir eso**, o el CI de imagen seguirá siendo ciego.

### Decisión de diseño dentro de T0.7 (no es cosmética)

Hay dos formas de arreglarlo y **no son equivalentes**:

- **(a) Adaptar el test a la API actual** (`findById`): rápido (S), pero **fosiliza el fallo de aislamiento** — `SalesInvoiceServiceImpl.getById()/getAll()` seguirán recibiendo `tenantId` y no filtrando por él.
- **(b) Declarar `findByIdAndTenantId` en `TenantAwareRepository` y usarlo de verdad en los servicios**: M, y cierra el fallo de paso.

**Recomiendo (b).** El commit de tests `ca838778` es **anterior** al refactor de facturas `d497573f`: el test no está desactualizado, está describiendo el contrato que el refactor rompió. Arreglarlo "hacia abajo" borraría la evidencia de una regresión de aislamiento. Si por presión de tiempo se hace (a), abrir issue y forzar T2.6.

### Definition of Done — Fase 0

1. `mvn -B verify` verde en local y en CI, sin errores de compilación de tests.
2. CI en cada push y PR a `mono`; rama protegida.
3. `curl .../v3/api-docs` en prod → 401 o 404 (hoy devuelve 200).
4. Un registro público ya no es posible, o no otorga `ADMIN` (verificado decodificando el token).
5. Un JWT firmado con la clave antigua devuelve 401.
6. `/actuator/health` sigue 200 UP tras desplegar los cambios.
7. Auditoría de usuarios ejecutada y documentada; ADMINs espurios revocados.
8. Backup de BD verificado restaurando en un entorno de prueba.

### Riesgos de Fase 0

| Riesgo | Mitigación |
|---|---|
| Rotar la clave JWT expulsa a los usuarios activos | Ventana de baja actividad; avisar; el frontend ya redirige a login ante 401 |
| CI arranca rojo por *otros* tests apagados desde hace meses | Presupuestar 0,5-1 día extra. Si aparece un test roto no relacionado, `@Disabled` **con issue enlazado** — nunca borrarlo |
| Cerrar Swagger rompe un consumidor no documentado | Solo se cierra en perfil `prod`; verificado que el backoffice usa servicios tipados, no `/v3/api-docs` |
| Cerrar el registro deja fuera a un usuario legítimo pendiente de alta | Ejecutar T0.4 primero; dar de alta por invitación a quien corresponda antes de cerrar |

---

# FASE 1 — Endurecimiento del backend + permisos granulares

**Objetivo:** que el sistema desplegado sea correcto bajo carga y bajo abuso, no solo por el camino feliz. Todo aquí es de bajo riesgo funcional **porque la Fase 0 ya dio señal de regresión**.

## 1.A — Modelo de autorización granular

### El diagnóstico es peor de lo que decía la auditoría

No es que "falten `@PreAuthorize` en 4 controllers". El relevamiento completo de los 197 endpoints da esto:

- **58 endpoints sin ninguna anotación**, que caen en `anyRequest().authenticated()` — es decir, **cualquier usuario logueado puede ejecutarlos**. Y no son periféricos: los **19 de `InventoryController`** (crear sesión de inventario, confirmar, ajustar ítems, borrar — todo el ajuste de stock), los **11 de `SalesInvoiceController`** (emitir factura, registrar cobros, anular, borrar), los **15 de `QuoteController`** (incluido `convert-to-sale`) y los 13 de `PurchaseInvoiceController`.
- **Los roles anotados no existen.** `EMPLOYEE` aparece en ~70 endpoints; `APPROVER` y `AUDITOR` en `FiscalComplianceController`. El enum es `{ADMIN, MANAGER, USER}`. Consecuencia doble: **un usuario con rol `USER` no supera ninguna `@PreAuthorize` de la aplicación** (el sistema es de facto binario ADMIN/MANAGER), y los endpoints de compliance son **inalcanzables para todos**.
- El CHECK constraint del rol está **hardcodeado en el DDL** (`tbl_users` y `tbl_invitation_tokens`), así que hoy añadir un rol exige una migración con `DROP CONSTRAINT`.

### El diseño: `recurso:accion`

Se adopta el patrón que ya está probado y en producción en el BFF del portal (`web-hoffmann`), adaptado a las necesidades de un ERP:

- **`Permission`** como `@Embeddable` de dos campos (`resource`, `action`). No hay tabla global de permisos ni ABM de permisos: añadir uno es una fila, no una migración de enum.
- **`Role`** como entidad con `code` estable (usado desde código y seed), `name`, `description`, y `@ElementCollection` de permisos en `role_permissions` con PK compuesta.
- **Usuario ↔ roles N-a-N** desde el principio, aunque al empezar cada usuario tenga uno solo. Es mucho más barato permitirlo ahora que migrarlo después.
- **`RoleCatalog`**: una única clase que declara la matriz recurso×acción y los roles semilla, **con el porqué de negocio documentado junto a la matriz**. Hoy esa matriz está dispersa en 140 anotaciones y con roles inventados; centralizarla es la mitad del valor del cambio.
- Authorities **sin prefijo `ROLE_`** → las anotaciones pasan a `hasAuthority('cash:open')`, que es legible y grepeable.

**Recursos** (derivados del inventario real): `products`, `brands`, `categories`, `pricing`, `price-items`, `imports`, `inventory`, `stock`, `sales`, `sales-invoices`, `purchases`, `quotes`, `cash`, `compliance`, `customers`, `suppliers`, `companies`, `branches`, `images`, `users`, `settings`, `audit`.

**Acciones**: `read`, `write`, `delete` — más verbos acotados de dominio, que son los que dan valor real al modelo: `cash:open`, `cash:close`, `inventory:confirm`, `sales-invoices:cancel`, `quotes:convert`, `compliance:approve`, `compliance:audit`.

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T1.A1** | Definir la matriz recurso×acción y los roles semilla (p. ej. `admin`, `encargado`, `vendedor`, `cajero`, `deposito`, `contable`) con su justificación de negocio. **Es la tarea que condiciona todas las demás de 1.A**; hacerla en papel antes de escribir código | nuevo `auth/authz/RoleCatalog.java` | **P1** | M | `[USUARIO]` + `[CÓDIGO]` |
| **T1.A2** | Entidades `Permission` (`@Embeddable`) y `Role`, relación N-a-N con `User`, y migración Flyway: tablas `roles`, `role_permissions`, `user_roles`; eliminar los CHECK hardcodeados de `tbl_users.role` y `tbl_invitation_tokens.role`; backfill de los usuarios actuales al rol equivalente | `auth/model/`, `db/migration/` | **P1** | L | `[CÓDIGO]` |
| **T1.A3** | `SecurityUser` pasa de emitir una authority `ROLE_X` a emitir el conjunto `recurso:accion` del usuario. **Detalle favorable:** `JwtFilter` ya resuelve las authorities desde la BD en cada request (el claim `role` del JWT es solo informativo para el frontend), así que el cambio **no invalida los tokens en circulación** y la revocación es inmediata. A cambio hay un hit a BD por request: añadir caché con invalidación al modificar un rol | `auth/security/principal/SecurityUser.java`, `JwtFilter.java` | **P1** | M | `[CÓDIGO]` |
| **T1.A4** | Reescribir las **139 anotaciones existentes** a `hasAuthority(...)` y **anotar los 58 endpoints hoy desnudos**. Prioridad dentro de la tarea: primero `InventoryController` (19), `SalesInvoiceController` (11) y `QuoteController` (15) — son los que hoy están abiertos a cualquier autenticado | controllers de todos los dominios | **P1** | L | `[CÓDIGO]` |
| **T1.A5** | **Test que valida que toda authority usada en un `@PreAuthorize` existe en `RoleCatalog`.** Escanea las anotaciones al arrancar y falla si hay una huérfana. Es barato y es exactamente lo que habría evitado el bug de `EMPLOYEE`/`APPROVER`/`AUDITOR` | `src/test/java/.../authz/` | **P1** | S | `[CÓDIGO]` |
| **T1.A6** | Invitaciones: `tbl_invitation_tokens.role` pasa a referenciar el rol nuevo; `CreateInvitationRequest` usa `roleCode` en vez del enum. Añadir listar y revocar invitaciones, que hoy no existen | `auth/`, `AdminInvitationController` | P2 | M | `[CÓDIGO]` |
| **T1.A7** | Auditoría por AOP con opt-out (`@NoAudit`), sobre la tabla `tbl_audit_log` **que ya existe** con índices por tenant, entidad, usuario y fecha. Hoy `AuditService` se invoca a mano y solo en 2 sitios; el aspecto da cobertura completa sin disciplina por endpoint | `shared/audit/` | P2 | M | `[CÓDIGO]` |
| **T1.A8** | Frontend: `TokenPayload` y el store pasan de `role` a `permissions: string[]`; `roleGuard` → `permissionGuard`; directiva estructural `*hasPermission`; `navigation.config.ts` cambia `roles?: NavRole[]` por una `permission` por entrada. **La superficie es pequeña**: 4 ficheros de `core/auth/`, el config de navegación, y solo 2 rutas usan hoy `roleGuard` | `frontend/web-client/src/app/core/auth/`, `layout/navigation/navigation.config.ts` | **P1** | M | `[CÓDIGO]` |

> **Patrón a copiar del portal:** para las acciones de dominio, que el backend devuelva en el DTO **qué authority requiere cada acción disponible**, y que el frontend filtre por eso. Evita reimplementar la matriz en el cliente y que las dos versiones diverjan.

> **Nota de alcance:** `RoleCatalog` define **roles semilla**, no una matriz editable por el cliente. La pantalla de edición de permisos por rol se construye en la Fase 3 (hoy `admin/roles` es un placeholder `EnConstruccion`).

## 1.B — Corrección y robustez

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T1.1** | **Bug de doble ejecución de la cadena de filtros.** La rama sin cabecera Bearer llama `filterChain.doFilter` (línea ~66) y hace `return` (~68), pero el `finally` (~102-110) vuelve a llamarlo (~105): en Java el `return` no salta el `finally`. Cada petición anónima a endpoint protegido atraviesa la cadena dos veces sobre una respuesta ya comprometida. **Fix: eliminar la llamada de la línea 66** y dejar el `finally` como único punto de continuación | `auth/security/jwt/JwtFilter.java:66` | **P1** | S | `[CÓDIGO]` |
| **T1.2** | Test de regresión de T1.1: `FilterChain` espiado que asserta **una sola** invocación con y sin token | nuevo `JwtFilterTest` | P1 | S | `[CÓDIGO]` |
| **T1.3** | `@Transactional` en `openSession`/`closeSession`: hoy son dos `save()` independientes y un fallo intermedio deja la caja inconsistente. Es el peor caso de los 23 servicios sin anotar porque toca dinero | `operation/cash/service/CashServiceImpl.java` | **P1** | S | `[CÓDIGO]` |
| **T1.4** | `@Transactional` en `BranchServiceImpl` y `CompanyServiceImpl` | `party/` | P1 | S | `[CÓDIGO]` |
| **T1.5** | Barrido de los 23/49 servicios restantes: `@Transactional` en escrituras, `readOnly = true` en lecturas. **Un PR por módulo**, no un commit gigante | `operation/`, `catalog/`, `inventory/`, `party/` | P2 | M | `[CÓDIGO]` |
| **T1.8** | `@Valid` en los `@RequestBody` que lo omiten + `@ControllerAdvice` que devuelva 400 con detalle de campo | controllers de `operation/`, `inventory/` | P2 | M | `[CÓDIGO]` |
| **T1.9** | Suite `@WebMvcTest` que asserta 401/403/200 por permiso en cada endpoint sensible. Es lo que hace verificable T1.A4 en CI | `src/test/java/.../security/` | **P1** | M | `[CÓDIGO]` |
| **T1.10** | `spring.jpa.open-in-view: false`. **Después** de T1.5 y T1.9, nunca antes: destapa `LazyInitializationException` donde la serialización dependía del `EntityManager` abierto en la vista | `application.yaml` (3 perfiles) | P2 | M | `[CÓDIGO]` |
| **T1.11** | Cabeceras de seguridad en `frontend/web-client/vercel.json`: `Strict-Transport-Security`, `Permissions-Policy`, `Content-Security-Policy`. Ya tiene `nosniff`, `X-Frame-Options` y `Referrer-Policy` | `vercel.json` | P2 | S-M | `[CÓDIGO]` |
| **T1.12** | Rate limiting en `/api/v1/auth/login` y `/api/v1/auth/password/forgot`. Sin esto, rotar la clave (T0.1) no protege de fuerza bruta de contraseñas | `auth/security/` | P2 | M | `[CÓDIGO]` |

> **Aviso sobre T1.11:** la CSP es la cabecera que más rompe Angular en silencio (estilos inline de componentes, `blob:` de Cloudinary, fuentes). Desplegar **primero como `Content-Security-Policy-Report-Only`** en una preview de Vercel, revisar consola, y solo entonces promover a enforce. Nunca directo a producción.

### Definition of Done — Fase 1

1. **0 endpoints sin autorización explícita.** Un test recorre los 197 y falla si alguno cae en `authenticated()` sin haberlo declarado deliberadamente.
2. `grep -r "EMPLOYEE\|APPROVER\|AUDITOR"` en `retail-api` → 0 resultados, y T1.A5 verde: ninguna authority huérfana.
3. Un usuario con rol de mostrador puede efectivamente operar (hoy el rol `USER` no supera ninguna anotación).
4. T1.2 verde: una sola pasada por la cadena de filtros.
5. Ningún servicio con escritura en `operation/` sin `@Transactional`.
6. `open-in-view: false` activo con la suite verde.
7. `curl -I https://retail.zaphirio.com` devuelve HSTS + CSP.
8. Backoffice recorrido manualmente end-to-end (compras, ventas, caja, inventario) sin regresiones.
9. Umbral Jacoco subido a ~40% en `auth` y `operation`.

### Riesgos de Fase 1

| Riesgo | Mitigación |
|---|---|
| **El cambio de modelo de autorización deja fuera a usuarios reales.** Es el riesgo mayor de la fase: se pasa de 2 roles efectivos a una matriz | Auditar roles reales (T0.4) **antes**; backfill explícito de cada usuario existente a su rol nuevo; desplegar en ventana vigilada mirando logs de 403; tener preparado un rol "compatibilidad" con los permisos del ADMIN actual |
| Anotar los 58 endpoints hoy abiertos rompe flujos del backoffice que dependían de que no hubiera control | T1.9 cubre la matriz antes de desplegar; pase manual completo del backoffice |
| `open-in-view: false` rompe endpoints de forma invisible a los tests unitarios | Última tarea de la fase; pase manual; es una línea de config, revert inmediato |
| `readOnly` mal puesto en un método que sí escribe | Un PR por módulo; los ~176 tests recuperados cubren buena parte |
| Desplegar el cambio de permisos y `open-in-view` juntos | **Despliegues separados**: dos fuentes simultáneas de 403/500 son indistinguibles |

---

# FASE 2 — Consolidación del dominio de factura de compra

**Objetivo:** dejar un solo modelo de factura de compra a proveedor, conservando la información fiscal argentina y la integración operativa.

### El diagnóstico, en corto

`Invoice` (`tbl_supplier_invoice`, `/api/v1/purchases`) y `PurchaseInvoice` (`tbl_purchase_invoices`, `/api/v1/purchase-invoices`) modelan **ambas la factura de compra a proveedor**. No hay herencia ni relación entre ellas: `PurchaseInvoice` nació en el commit `e6243746` ("Sales/Purchase invoice separation + Spain-compliant enums") como reemplazo de `Invoice` y **la migración nunca se completó**.

El reparto de virtudes está cruzado, y por eso la decisión no es obvia:

| | `Invoice` (gana) | `PurchaseInvoice` (se retira) |
|---|---|---|
| Integración real | Menú, routing, **ingreso de stock**, guarda de borrado de productos, cuenta corriente de proveedor, **todo el módulo de compliance fiscal** | Formulario **huérfano**; `/invoices/purchase/new` redirige al formulario legacy, que escribe en la *otra* tabla → su listado está permanentemente vacío. No aparece en el menú |
| Modelo fiscal | Desglose **argentino** completo: bases por alícuota 21/10,5/27/0, IVA por alícuota, 4 retenciones, impuestos internos/provincial/municipal, régimen fiscal, remito, moneda | IVA por línea como String `'0'\|'7'\|'21'` → **modelo español** |
| Calidad de código | 2 métodos de repositorio, `deleteById()` vacío con `// TODO`, sin update, sin tests, mapeo manual | 13 endpoints, 11 finders, mapper dedicado, `BigDecimal`, **628 líneas de tests** |

Migrar hacia `PurchaseInvoice` sería **destructivo** (se perdería todo el desglose fiscal argentino y `OtherConcept`) y contradice la decisión de mercado. La dirección elegida —conservar `Invoice` y portarle lo bueno del otro— es **aditiva y barata**.

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T2.0** | Contar filas en producción antes de tocar nada: `tbl_purchase_invoices`, `tbl_purchase_invoice_items`, `tbl_supplier_invoice`, `tbl_supplier_invoice_item`, `tbl_other_concept`. Se espera que las de `purchase_invoices` estén vacías (no hay camino de UI para insertar). Si NO lo están, hay que mapearlas a `tbl_supplier_invoice` rellenando `tax_regime` y `finalization_status`, que son `NOT NULL` sin default | Postgres de Railway | **P1** | S | `[USUARIO]` |
| **T2.1** | **Portar a `Invoice` lo bueno de `PurchaseInvoice`**, en migración aditiva: estados de pago (`InvoiceStatus` + importe pagado — hoy `Invoice` no sabe si está pagada y la cuenta corriente lo deduce por diferencia); `supplierInvoiceNumber` separado del número interno, con unicidad para bloquear duplicados; retenciones a `BigDecimal` con recálculo en servidor (hoy son 6 `double`, y `double` para importes fiscales es un problema en sí); `tenantId` a `nullable = false` | `operation/invoice/model/Invoice.java`, `db/migration/V2__…sql` | **P1** | L | `[CÓDIGO]` |
| **T2.2** | Completar `InvoiceService`: hoy `deleteById()` es un cuerpo vacío con `// TODO implement rollback`, **no existe update**, y `getAll()` hace `findAll()` sin paginar. Portar los 9 finders útiles de `PurchaseInvoiceRepository` (impagadas, por rango de fechas, por estado) | `operation/invoice/service/InvoiceServiceImpl.java`, `repository/` | **P1** | L | `[CÓDIGO]` |
| **T2.3** | **Portar los 628 tests de `PurchaseInvoiceServiceTest` a `InvoiceServiceImpl`**, que hoy tiene cobertura cero. Es el mayor activo recuperable del módulo que se retira | `src/test/java/.../operation/invoice/` | **P1** | M | `[CÓDIGO]` |
| **T2.4** | Retirar `PurchaseInvoice`: entidad, items, repositorio, servicio, mapper, DTOs y `PurchaseInvoiceController`. En el backoffice, retirar `features/invoices/pages/purchase-invoice-*` (incluido el formulario huérfano) y `core/services/purchase-invoice.service.ts` | `operation/invoice/`, `frontend/web-client/src/app/features/invoices/` | P1 | M | `[CÓDIGO]` |
| **T2.5** | Migración Flyway que elimina `tbl_purchase_invoices` y `tbl_purchase_invoice_items`. **Despliegue separado** del que añade columnas (T2.1): primero se añade y se migra, después se borra. Nunca ambos a la vez | `db/migration/` | P1 | S | `[CÓDIGO]` |
| **T2.6** | **Cerrar el cruce de tenants en la capa de repositorio.** 35 repositorios extienden `TenantAwareRepository`, pero `withTenant(...)` no lo invoca **ningún** servicio (solo aparece en las 2 interfaces que lo definen), y `Product.tenantId` admite nulos: heredar la interfaz no filtra nada. `SalesInvoiceServiceImpl.getById()/getAll()` reciben `tenantId` y no lo usan. Añadir `findByIdAndTenantId` a `TenantAwareRepository` y usarlo de verdad. Aunque el MVP sea mono-comercio, es barato **ahora** —ya se está tocando esta capa— y caro después | `shared/repository/TenantAwareRepository.java`, servicios de `operation/` y `catalog/` | **P1** | L | `[CÓDIGO]` |
| **T2.7** | Retirar código muerto: `TenantOnboardingService` (nunca inyectado), `currentTenant()` si sigue sin uso tras T2.6, y los controllers `/internal/*` (superficie HTTP sin clientes externos: los llamantes son in-process) | varios | P2 | M | `[CÓDIGO]` |
| **T2.8** | Los endpoints `/audit-trail` y `/versions` de `FiscalComplianceController` devuelven **mock hardcodeado**. Implementarlos de verdad o retirarlos del contrato OpenAPI. **Bloquea T3.17**: no se conecta a la UI un endpoint que miente | `operation/.../FiscalComplianceController.java` | P2 | S-M | `[CÓDIGO]` |
| **T2.9** | **Mover la máquina de inmutabilidad/versionado fiscal de `Invoice` (compra) a `SalesInvoice` (venta).** Está aplicada a la entidad equivocada: la que tiene relevancia fiscal es la de venta | `operation/invoice/` | P2 | L | `[CÓDIGO]` |

### Definition of Done — Fase 2

1. Un solo controller de factura de compra en el OpenAPI desplegado; `/api/v1/purchase-invoices` devuelve 404/410.
2. Sin referencias a `purchase-invoice` en `frontend/web-client/src/app`.
3. Migración Flyway aplicada en Railway y `ddl-auto: validate` sigue arrancando.
4. **Los cuatro subsistemas que dependían de `Invoice` siguen funcionando**: ingreso de stock desde factura, guarda de borrado de productos, cuenta corriente de proveedor y compliance fiscal.
5. Los 628 tests portados pasan contra `InvoiceServiceImpl`; cobertura de `operation/` ≥ 50%.
6. Test que inserta dos tenants y asserta aislamiento en los finders de `operation/` y `catalog/`.
7. Inmutabilidad fiscal operando sobre `SalesInvoice`.

### Riesgos de Fase 2

| Riesgo | Mitigación |
|---|---|
| **Se rompe el ingreso de stock o la cuenta corriente al tocar `Invoice`** | Es el riesgo real de esta fase: `Invoice` está enganchado a 4 subsistemas. T2.3 (portar los tests) va **antes** de T2.4 (retirar), no después |
| Hay filas en `tbl_purchase_invoices` que nadie esperaba | T2.0 lo verifica antes de empezar; si las hay, mapearlas rellenando `tax_regime` y `finalization_status` (ambos `NOT NULL` sin default) |
| La migración de datos pierde o duplica registros | Backup previo (T0.6); dos despliegues separados; conciliación de conteos y sumas antes/después |
| T2.6 rompe consultas si hay registros con `tenantId` nulo | Auditar nulos en producción antes; migración de backfill si aplica |
| T2.1/T2.2 se convierten en un refactor sin fin | Timebox de una semana; si se desborda, marcar `PurchaseInvoiceController` como `@Deprecated` con log de aviso y avanzar |

---

# FASE 3 — Completitud funcional

**Objetivo:** que RetailManager sea un producto operable de punta a punta y que **lo que promete sea lo que hace**.

### El diagnóstico: el menú promete el doble de lo que existe

De las 26 entradas del menú, **15 llevan a una pantalla `EnConstrucción`** — el 58%. Y hay tres problemas peores que las pantallas vacías:

- **El dashboard miente.** Las variaciones porcentuales de ingresos, pedidos, clientes y productos son `Math.random()` (`core/services/dashboard-data.service.ts`, con el comentario `mock: random percentage` en el propio código). `inventory-data.service.ts` devuelve resúmenes de depósito y movimientos de stock **totalmente inventados**. Y los 7 gráficos de `analytics-data.service.ts` tienen `catchError(() => getMock…())`: **si el backend falla, el usuario ve cifras falsas sin saberlo**. Una pantalla vacía es honesta; ésta no.
- **Hay trabajo terminado que nadie puede alcanzar.** `/invoices/sales` y `/invoices/purchase` tienen listado y detalle funcionales y **no aparecen en el menú**: no hay una sola referencia en toda la app. Además, dos formularios completos (771 líneas entre ambos) están huérfanos porque la ruta `new` hace `redirectTo` al formulario legacy.
- **Cinco llamadas del frontend apuntan a endpoints que no existen** y fallan con 404 en silencio: `/quotes/status` (el backend es `/quotes/status/{status}`), `/quotes/expired` (es `/quotes/expiring`), `/transactions/supplier/{id}` (no existe el controller), `/categories/by-name` y `/suppliers/by-name`. Y dos `POST` de dinero envían **body vacío `{}`**: el registro de cobros y la actualización de retenciones.

### Alcance decidido

**Se construye:** recibos y pagos · usuarios, invitaciones y permisos · contabilidad argentina (Libro IVA, Retenciones, Libro Mayor).
**Se retira del menú:** informes/reporting, remitos, servicio técnico y toda la sección de ecommerce. Son 9 entradas fantasma que desaparecen sin escribir una línea de funcionalidad.

## 3.A — Sinceridad del producto (primero, y es barato)

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.1** | **Purgar los datos falsos.** Eliminar los `Math.random()` de `dashboard-data.service.ts`, `inventory-data.service.ts` y `sales-data.service.ts`, y los 7 `catchError → mock` de `analytics-data.service.ts`. Sustituir por estado "sin datos" o error visible. **Es lo primero de la fase**: hoy cualquier decisión de negocio tomada mirando el dashboard está tomada sobre ruido | `frontend/web-client/src/app/core/services/` | **P0** | M | `[CÓDIGO]` |
| **T3.2** | Retirar del menú y del routing lo que no se va a construir: sección **Ecommerce** (4 rutas + la entrada externa "Ver tienda"), **Servicio Técnico** (2 rutas, sin nada detrás en ninguna capa), **Informes** (3 rutas) y **Remitos** | `layout/navigation/navigation.config.ts`, `app.routes.ts` | **P1** | S | `[CÓDIGO]` |
| **T3.3** | **Conectar al menú `/invoices/sales` y `/invoices/purchase`**, y enrutar los dos formularios huérfanos en vez de redirigir al legacy. Es trabajo ya escrito que hoy no existe para el usuario | `navigation.config.ts`, `features/invoices/invoices.routes.ts` | **P1** | S | `[CÓDIGO]` |
| **T3.4** | Arreglar las 5 llamadas rotas y los dos `POST` con body vacío. Añadir un test de contrato que recorra los servicios Angular y verifique que cada URL existe en el OpenAPI del backend — así no vuelve a pasar | `core/services/quote.service.ts`, `services/transaction.service.ts`, `category.service.ts`, `supplier.service.ts` | **P1** | M | `[CÓDIGO]` |

## 3.B — Cerrar el ciclo operativo

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.5** | **Recibos y pagos.** Es la brecha operativa más cara: hoy no hay forma de registrar un cobro de cliente ni un pago a proveedor desde el backoffice, **aunque el backend ya lo soporta** (`POST /sales-invoices/{id}/payments`, `POST /purchases/supplier/{id}/payments`). Incluye imputación a facturas y reflejo en la cuenta corriente | nuevas pantallas en `pages/` , `core/services/` | **P0** | L | `[CÓDIGO]` |
| **T3.6** | Completar los servicios a medias: `delete`/`restore`/`force` en `supplier.service.ts` (hoy no se puede borrar un proveedor), depósitos de sucursal en `branch.service.ts` (la ruta `/configuracion/general/depositos` es un `redirectTo` a sucursales), `PATCH /product-price-links/price-update` (aplicar la subida de precio desde la alerta), polling del estado de `import-jobs`, y el árbol de categorías | `core/services/`, `services/` | P1 | M | `[CÓDIGO]` |
| **T3.7** | Exponer en UI las operaciones de catálogo que ya existen en los servicios pero no invoca nadie: `merge`, `restore` y `force-delete` de marcas y productos | `pages/brand/`, `pages/product/` | P2 | M | `[CÓDIGO]` |

## 3.C — Administración: usuarios, invitaciones y permisos

Es la contraparte de UI del modelo de la Fase 1. Hoy el backend de invitaciones está **completo** (`POST /admin/invitations`, `GET /invitations/{token}/info`, `POST /invitations/accept`) y **no hay ni una sola pantalla**; el menú "Usuarios" y las rutas `admin/roles` y `admin/auditoria` son placeholders.

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.8** | Gestión de usuarios: listado, alta por invitación, reenvío y revocación, activación/desactivación, asignación de roles. Sin esto **un cliente no puede dar de alta a su equipo** | `/configuracion/usuarios` | **P0** | L | `[CÓDIGO]` |
| **T3.9** | Pantalla de roles y permisos: ver la matriz recurso×acción por rol y asignar roles. Editar la matriz es opcional en esta fase; asignar no lo es | `/admin/roles` | **P1** | M | `[CÓDIGO]` |
| **T3.10** | Visor de auditoría sobre `tbl_audit_log`, con filtros por actor, entidad y rango de fechas. La tabla y el aspecto AOP vienen de T1.A7 | `/admin/auditoria` | P2 | M | `[CÓDIGO]` |
| **T3.11** | Aplicar el `permissionGuard` de verdad a las rutas de configuración y finanzas. Hoy el filtrado por rol es **puramente cosmético del sidebar**: no hay control de acceso real en el router | `app.routes.ts` | **P1** | S | `[CÓDIGO]` |

## 3.D — Contabilidad argentina

**Ojo con el punto de partida:** el menú etiqueta este bloque con badges `ES` y `AEAT` y una entrada "Facturación electrónica" — restos de la orientación española ya descartada. Lo primero es reorientar el rótulo y el alcance a AFIP. No existe backend contable hoy: esta sub-fase es backend + frontend desde cero, y es la más cara de la fase.

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.12** | Definir el alcance contable real con criterio de negocio: qué libros son obligatorios, con qué periodicidad y en qué formato de exportación. **Decisión de negocio previa al código** | — | **P1** | M | `[USUARIO]` |
| **T3.13** | Backend del Libro IVA (ventas y compras) sobre `SalesInvoice` e `Invoice`, con el desglose por alícuota que `Invoice` ya guarda (21/10,5/27/0) | nuevo `operation/accounting/` | P1 | L | `[CÓDIGO]` |
| **T3.14** | Backend de retenciones: IIBB, IVA, Ganancias y SUSS, que `Invoice` ya modela como campos. Agregación por período y por proveedor | `operation/accounting/` | P1 | L | `[CÓDIGO]` |
| **T3.15** | Libro Mayor / plan de cuentas. Es la pieza más grande y la que más conviene acotar: valorar si en esta fase basta con exportación para el contador externo en vez de contabilidad completa | `operation/accounting/` | P2 | XL | `[CÓDIGO]` |
| **T3.16** | Pantallas de los tres libros, con filtros de período y exportación | `pages/contabilidad/` | P1 | L | `[CÓDIGO]` |
| **T3.17** | Conectar `FiscalComplianceController` a la UI (`finalize`, `cancel`, `status`, `audit-trail`, `versions`). El backend existe desde hace meses y **no lo consume nadie**; su pantalla es un placeholder. Depende de que T2.8 haya sustituido los endpoints mock por implementación real | `pages/contabilidad/` | P1 | M | `[CÓDIGO]` |

## 3.E — Calidad del frontend

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.18** | **ESLint + Prettier**, que hoy no existen en absoluto (ni config, ni script `lint`, ni dependencias), más el job en CI. El `tsconfig` sí es estricto, pero hay mucho `any` que pasa `strict` sin aportar seguridad | `frontend/web-client/` | **P1** | S | `[CÓDIGO]` |
| **T3.19** | Tests de los servicios que tocan dinero: `cash`, `sales-invoice`, `customer-invoice` y el nuevo de pagos. Hoy el frontend tiene **un solo spec, de 6 líneas, que asserta `true`** — la infraestructura de Karma está lista y sin usar | `**/*.spec.ts` | **P1** | L | `[CÓDIGO]` |
| **T3.20** | Retirar el código muerto del backoffice: `HomeComponent`, `DashboardComponent`, `dashboard.routes.ts`, `dashboard-layout`, el `shared/components/sidebar` duplicado (el vivo es `layout/sidebar`), `shared/components/header`, `services/stock.service.ts` (clase vacía) y `services/transaction.service.ts` (roto). Resolver la duplicación de `ProductSearchComponent` | `frontend/web-client/src/app/` | P2 | M | `[CÓDIGO]` |
| **T3.21** | Eliminar `jquery`, `bootstrap` y `popper.js` de `package.json` y el `"types": ["jquery"]` del `tsconfig`. No se cargan en `angular.json`; además hay dos versiones de Popper conviviendo | `package.json`, `tsconfig.json` | P3 | S | `[CÓDIGO]` |

### Definition of Done — Fase 3

1. **Cero `Math.random()` y cero `mock` en los servicios de datos.** Un grep lo verifica.
2. Ninguna entrada del menú lleva a `EnConstrucción`: o está construida, o se retiró.
3. Ciclo completo verificado en producción: emitir factura → registrar cobro → verlo reflejado en la cuenta corriente y en la caja.
4. Un administrador puede invitar a un usuario, asignarle un rol y comprobar que ese usuario ve solo lo suyo.
5. Libro IVA de un período real cuadra contra las facturas del período.
6. `npm run lint` en verde dentro del CI, y specs de los servicios de dinero pasando.
7. Ninguna llamada del frontend devuelve 404 (test de contra contra el OpenAPI).

### Riesgos de Fase 3

| Riesgo | Mitigación |
|---|---|
| **La contabilidad se come la fase.** Es XL, sin backend previo y muy regulada | Acotar T3.15 explícitamente: valorar exportación para el contador antes que un Libro Mayor completo. Hacerla **la última** sub-fase, para que lo demás ya esté entregado |
| Retirar entradas del menú se percibe como pérdida de funcionalidad | Nunca hubo funcionalidad: eran pantallas vacías. Comunicar como lo que es — dejar de prometer lo que no existe |
| Purgar los datos falsos deja el dashboard casi vacío | Es el resultado correcto y honesto. Si el dashboard queda pobre, la respuesta es construir los endpoints de agregación, no volver a inventar cifras |
| Los formularios huérfanos que se enrutan (T3.3) llevan meses sin ejecutarse y pueden estar rotos | Probarlos antes de exponerlos en el menú; presupuestar arreglo, no solo enrutado |

---

# FASE 3-bis — Retirada del prototipo de ecommerce

Trabajo pequeño y sin dependencias; puede hacerse en cualquier momento a partir de la Fase 0.

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T3.22** | Eliminar `frontend/ecommerce` del repo | `frontend/ecommerce/` | P2 | S | `[CÓDIGO]` |
| **T3.23** | Quitar el acoplamiento del backoffice: la entrada de menú con `externalUrl: environment.ecommerceUrl` y la variable en ambos `environment*.ts`. El acoplamiento es mínimo — un solo punto | `web-client/src/app/layout/navigation/navigation.config.ts:217`, `src/environments/*.ts` | P2 | S | `[CÓDIGO]` |
| **T3.24** | Dar de baja el proyecto Vercel `retail-ecommerce` y su dominio | Panel de Vercel | P2 | S | `[USUARIO]` |
| **T3.25** | Retirar el origen del portal descartado de `CORS_ALLOWED_ORIGINS` en Railway | Railway | P2 | S | `[USUARIO]` |

---

# FASE 4 — Escala y cumplimiento (reactiva)

**No ejecutar por defecto.** Cada bloque se activa por un disparador concreto.

## 4.A — Multitenancy real en `retail-api` · *Disparador: entra un segundo comercio*

La infraestructura está declarada pero **no cableada**. Existen `TenantContext`, `TenantFilter` (con el anti-spoofing ya cerrado), `TenantAwareRepository`/`TenantAwareQuery`/`TenantAwareSpecifications`, y **35 repositorios extienden `TenantAwareRepository`** — pero `withTenant(...)` aparece en **2 ficheros, que son las dos interfaces que lo definen**. Ningún servicio lo invoca jamás, y `Product.tenantId` admite nulos. Heredar la interfaz no filtra nada: **las consultas de catálogo hoy cruzan tenants**. Tampoco hay ningún `@Filter`/`@FilterDef`/`@TenantId` de Hibernate.

| ID | Tarea | Sev | Esf |
|---|---|---|---|
| T4.1 | `@FilterDef`/`@Filter` (o `@TenantId`) en las entidades + activación por request desde `TenantContext` | P1 | XL |
| T4.2 | `Product.tenantId` a `nullable = false` con backfill; usar de verdad `withTenant(...)` en los servicios | P1 | L |
| T4.3 | Tests de aislamiento cruzado sobre las 42 tablas del baseline | P1 | L |
| T4.4 | Alcance de permisos por sucursal, si para entonces hace falta (el modelo de la Fase 1 se deja preparado para admitirlo sin migración destructiva) | P2 | L |

> **T2.6 es el prerrequisito de todo 4.A.** Si se hace bien en Fase 2, esta sub-fase baja de XL a L.
> **4.A es a su vez prerrequisito de la Fase 5.**

## 4.B — Consolidación fiscal argentina · *Disparador: exigencia fiscal real*

Verifactu queda **descartado**. La orientación implementada ya es argentina: 16 ficheros con CUIT/AFIP/monotributo (`TaxRegime.java`, `ArgentineValidator.java`, `TaxComplianceService.java`). Parte del trabajo contable se adelanta a la Fase 3 (3.D); lo que queda aquí es la integración fiscal en sí.

| ID | Tarea | Sev | Esf |
|---|---|---|---|
| T4.5 | Completar la integración AFIP real (numeración, CAE, remisión) sobre la base existente | P1 | XL |
| T4.6 | Encadenamiento hash y versionado sobre `SalesInvoice` (parte ya cubierta por T2.9) | P1 | L |
| T4.7 | Implementar de verdad `audit-trail` y `versions` si no se retiraron en T2.8 | P2 | M |

## 4.C — Design system · *Disparador: marca visible fuera del backoffice*

Con el portal descartado de este repo, el caos de tokens queda confinado a **una sola app**, y de tres primarios solo uno se usa. Es una eliminación de código muerto, no una negociación de marca.

| ID | Tarea | Fichero | Sev | Esf |
|---|---|---|---|---|
| T4.8 | Paleta única. El teal `#0d9488` (`web-client/src/styles.css:12`) es el **único con uso real en runtime**; el azul `#3b82f6` de `tailwind.config.js` y `design-tokens.css:31` tiene **0 usos confirmados por grep** → se elimina, no se migra | ver columna | P2 | M |
| T4.9 | Convención única: escala `--color-primary-500` **o** plano `--primary`, no ambas | `design-tokens.css`, `styles.css` | P2 | L |
| T4.10 | Tipografía única: hoy Roboto en `styles.css` vs Inter en `tailwind.config.js` | `web-client` | P3 | S |

## 4.D — Observabilidad

| ID | Tarea | Sev | Esf | Tipo |
|---|---|---|---|---|
| T4.11 | Logs estructurados + correlación de request | P2 | M | `[CÓDIGO]` |
| T4.12 | Métricas de negocio en Micrometer | P2 | M | `[CÓDIGO]` |
| T4.13 | Alertas de caída y de tasa de 5xx | P2 | M | `[USUARIO]` |

---

# FASE 5 — (Futura) Convergencia con el portal

> **Diferida por decisión explícita.** No se toca hasta que RetailManager funcione correctamente por sí mismo (fin de Fase 3). Se documenta aquí por una razón concreta: **para que las Fases 1-3 no tomen decisiones que la hagan imposible o cara**, no para ejecutarla ahora.
>
> Las tres restricciones que conviene respetar mientras tanto: no duplicar en `retail-api` lo que el portal ya resuelve; cerrar el cruce de tenants (T2.6) antes de pensar en superficie pública; y mantener `inventory/` capaz de responder stock por sucursal.

## 5.A — Qué es realmente `web-hoffmann`

`web-hoffmann` **no es un prototipo de portal**: es un ecommerce completo y desplegado para un comercio real (Hoffmann Instrumentos Musicales), construido en ~9 días de trabajo muy intenso. Monorepo Angular 22 + Tailwind 4 con `apps/storefront` (SSR), `apps/admin` (26 pantallas), `libs/ui`, `libs/domain` (tipos generados desde OpenAPI) y **su propio backend Java** `storefront-bff` (Spring Boot 4.1, Java 25): **641 ficheros Java, 74 tests, 44 migraciones Flyway**. Desplegado en Vercel (storefront + panel) y Railway (BFF + Postgres), hoy con `noindex` activo como interruptor de lanzamiento.

Su arquitectura actual es: **el ERP externo "Heaven" (producto de terceros, API REST) es la fuente de producto, precio, stock y presupuesto; el BFF es dueño de todo lo demás** — pedido, carrito, checkout, pagos, envíos, búsqueda full-text, CMS, SEO, feeds. El proyecto ya contempla explícitamente su sustitución: `docs/DEUDA-HEAVEN.md` es literalmente la lista de "lo que hay que hacer bien el día que Heaven se reemplace por RetailManager".

**Consecuencia directa para este plan: `retail-api` NO debe construir un módulo `Order`, ni carrito, ni checkout, ni pasarela, ni búsqueda.** Todo eso ya existe, funciona y está mejor resuelto en el BFF del portal. La convergencia no es "construir el ecommerce en RetailManager": es **sustituir a Heaven por `retail-api` detrás de un puerto que ya está definido**.

### La frontera (decidirla antes de escribir código)

| Capacidad | Dueño |
|---|---|
| Producto, marca, categoría, listas de precio, **stock por sucursal**, sucursales, cliente del ERP, presupuesto/factura | **`retail-api`** |
| Slug, SEO, taxonomía curada, facetas, contenido/CMS, búsqueda, carrito, pedido web, pagos, envíos, cupones, planes de cuotas | **`storefront-bff`** |

El precio de venta al público lo fija **siempre** el `PricingEngine` del portal (regla única y explícita hoy); `retail-api` aporta la lista de precio, no el número final. No diluir esa autoridad.

### El puerto ya existe

El BFF aísla Heaven tras `HeavenClient` (5 operaciones: `listProducts`, `getByIdc`, `getDetailByIdc`, `getStock`, `getTaxonomy`) + `HeavenMapper`. Su propia documentación dice que al llegar el modelo real se reemplaza el mapper y ningún servicio ni componente debería cambiar. **Ese es el punto de entrada de toda la convergencia.**

## 5.B — Preparar `retail-api` para ocupar el lugar de Heaven

| ID | Tarea | Fichero/módulo | Sev | Esf | Tipo |
|---|---|---|---|---|---|
| **T5.1** | **Superficie pública de catálogo con resolución de tenant por host.** Hoy `/api/v1/products` exige permisos de backoffice, y `TenantFilter` **rechaza con 401 todo endpoint no público sin tenant en el JWT** — el mecanismo de tenant depende de que haya usuario logueado, que es justo lo que un portal público no tiene. Hace falta una superficie nueva (`/api/v1/storefront/**`) con acceso público en **las dos capas** (`SecurityConfig` y `JwtFilter.PUBLIC_PATHS`) y tenant resuelto por dominio, no por JWT. **DTOs propios**: los actuales exponen coste, proveedor y márgenes | `auth/security/`, nuevo `catalog/.../StorefrontController` | P1 | L | `[CÓDIGO]` |
| **T5.2** | Listado masivo con precio y stock incluidos. Es la deuda nº2 del portal: Heaven no los da en el listado, y por eso el catálogo y la búsqueda no pueden mostrar disponibilidad | `catalog/`, `inventory/` | P1 | M | `[CÓDIGO]` |
| **T5.3** | **Stock desagregado por sucursal.** Es la deuda nº1: hoy el portal tiene en producción un fallback que atribuye todo el stock a una sucursal y niega la otra | `inventory/` | P1 | M | `[CÓDIGO]` |
| **T5.4** | Reserva y liberación de stock. El portal tiene el `confirm` de presupuesto **apagado por flag** porque Heaven no ofrece `release` | `inventory/` | P1 | L | `[CÓDIGO]` |
| **T5.5** | Presupuesto/pedido desde el portal, equivalente al `POST /invoice` de Heaven. El encaje natural es `operation/quote` (ya tenant-aware). Aquí hay diseño nuevo, no solo mapeo | `operation/quote/` | P1 | L | `[CÓDIGO]` |
| **T5.6** | Sincronización incremental o por eventos. Hoy el portal hace una sync completa de 11-24 min cada 24 h, y su sync **nunca borra huérfanos** (bug confirmado en su lado) | `catalog/` | P2 | M | `[CÓDIGO]` |
| **T5.7** | Campos de producto para venta online: descripción larga, galería en varias variantes de imagen (deuda nº6: hoy la ficha amplía la miniatura y se ve borrosa), flag `publishedOnline` | `catalog/`, `media/` | P1 | M | `[CÓDIGO]` |
| **T5.8** | Taxonomía completa y navegable. El portal solo tiene 6 rubros curados de 274 → **94,7% del catálogo sin categoría navegable**; `retail-api` tiene jerarquía real | `catalog/category/` | P1 | M | `[CÓDIGO]` |
| **T5.9** | Caché y `Cache-Control` en la superficie pública: tráfico anónimo contra un backend en plan modesto | `StorefrontController` | P2 | M | `[CÓDIGO]` |

## 5.C — Trabajo en el repo del portal `[repo web-hoffmann]`

| ID | Tarea | Sev | Esf | Tipo |
|---|---|---|---|---|
| **T5.10** | **CI para el portal.** No tiene: `.github/` solo contiene hooks de una herramienta de migración de Java. 74 tests de backend que nadie ejecuta automáticamente | **P1** | M | `[CÓDIGO]` |
| **T5.11** | Escribir `RetailApiClient implements HeavenClient` + su mapper. Si `retail-api` responde bien las 5 operaciones del puerto, el resto del BFF no se toca | **P1** | L | `[CÓDIGO]` |
| **T5.12** | Persistir `SlugRegistry` y `SkuIndex` en tablas propias. Hoy son mapas en memoria reconstruidos desde el catálogo, con historial de bugs por eso mismo | P2 | M | `[CÓDIGO]` |
| **T5.13** | Sustituir la proyección `heaven_catalog_products` (blob JSON único) o reestructurarla con columnas reales **y borrado de huérfanos** | P2 | M | `[CÓDIGO]` |
| **T5.14** | Regenerar el snapshot OpenAPI: el contrato tipado del front cubre menos de la mitad de la API real | P2 | S | `[CÓDIGO]` |

## 5.D — Multitenancy del portal

También diferida. El comercio no está "configurado" en `web-hoffmann`, está **cableado estructuralmente**: nombre del paquete Java (641 ficheros), taxonomía hardcodeada en un constructor, numeración de pedidos, sistema de diseño, y un modelo donde los ajustes del comercio son literalmente **una tabla de una sola fila** (`ShopSettings.singleton = true`). `grep -i tenant` sobre todo el repo da 0 resultados.

| ID | Tarea | Sev | Esf |
|---|---|---|---|
| **T5.15** | Resolución de tenant por host; hoy el BFF tiene un único origen CORS y no arranca con comodines | P1 | L |
| **T5.16** | `tenant_id` en las 44 migraciones, con constraints compuestas: número de pedido, slugs y cupones pasan de unique global a unique por tenant | P1 | XL |
| **T5.17** | Desingletonizar los maestros: ajustes del comercio, modo de sitio, taxonomía, sucursales, planes de pago, cuentas bancarias, plantillas de email, navegación y contenido | P1 | XL |
| **T5.18** | Credenciales por tenant. El patrón ya existe y es bueno (credenciales de pago cifradas y cargadas desde el panel): extenderlo a email, transportistas y backend de catálogo | P1 | L |
| **T5.19** | Índice de búsqueda por tenant: hoy es global y se reindexa entero cada 30 min — no escala a N comercios | P1 | L |
| **T5.20** | Theming por tenant. El sistema de diseño es deliberadamente rígido: o se parametriza, o todos los comercios se ven igual | P2 | L |
| **T5.21** | Renombrar el paquete y el prefijo de configuración; numeración de pedidos parametrizable | P2 | M |

> **Decidir antes de escribir el routing público definitivo:** subdominio, path o instancia por comercio. Condiciona URLs, SEO y la clave de cada índice, y rehacerlo después cuesta semanas.

### Riesgos de Fase 5

| Riesgo | Mitigación |
|---|---|
| **Duplicar en `retail-api` lo que el portal ya resuelve bien** (pedido, carrito, pagos, búsqueda, CMS) | Fijar la frontera de 5.A **antes** de escribir una línea. La búsqueda full-text con sinónimos y analítica se queda en el portal; migrarla sería destruir valor |
| Convergencia y multitenancy a la vez | Un solo comercio como tenant durante 5.B/5.C. Multitenizar antes de sustituir Heaven es pagar el refactor dos veces sobre una base que va a cambiar de fuente de datos |
| El puerto `HeavenClient` no encaja del todo y el modelo de `retail-api` se filtra por todo el BFF | Respetar el mapper como única frontera; si una operación no encaja, ampliar el puerto explícitamente, nunca puentearlo |
| Migrar el catálogo rompe el portal en producción | Hacerlo **antes** del lanzamiento público del portal, aprovechando que hoy está con `noindex` |
| El precio final se diluye entre dos autoridades | El motor de precios del portal sigue siendo la única autoridad del número cobrado; `retail-api` aporta lista de precio |

---

# VÍA TRANSVERSAL — Deuda técnica

Sin fase propia. Regla: **cuando una tarea de fase toque un fichero afectado, se limpia de paso.** No justifica PR aparte salvo que sea trivial y aislado.

| ID | Tarea | Sev | Esf |
|---|---|---|---|
| TT.1 | Eliminar `api-gateway`, `config-server` y `service-registry` del POM padre y del repo, con sus ~20 `.yml` que aún llevan `root1234` versionado. Riesgo bajo (desactivados), pero es ruido, alarga el build de CI y es una trampa para quien llegue nuevo | P3 | S |
| TT.2 | Eliminar `frontend/erp-structure` (100+ directorios vacíos, 0 ficheros) | P3 | S |
| TT.3 | SSR del backoffice: está compilado pero desplegado como SPA estática. Eliminarlo o desplegarlo de verdad | P3 | M |
| TT.4 | Marcar `docs/plans/PLAN_DESARROLLO_POR_BLOQUES.md` como obsoleto o sustituirlo por este documento | P2 | S |
| TT.5 | Unificar `layout/` y `shared/components/`: hay dos sidebars y dos headers, uno de cada par muerto. Sale gratis al hacer T3.20 | P3 | S |

> Las limpiezas de código muerto del backoffice (T3.20), las dependencias fantasma (T3.21) y el destino de las 15 pantallas `EnConstrucción` (T3.2) **dejan de ser transversales y pasan a ser tareas con dueño en la Fase 3**, porque son parte del objetivo de esa fase: que el producto no prometa lo que no hace.

---

# Justificación del orden

## Por qué la contención va incluso antes que el CI

Dentro de la Fase 0 hay un orden interno. El bloque 0.A no espera a nada porque el sistema **ya está en internet**: `retail.zaphirio.com` responde 200 y el registro público otorga `ADMIN`. Eso es toma de control administrativa por autoservicio, hoy, sin explotar ninguna vulnerabilidad — solo rellenando el formulario de registro. Combinado con `/v3/api-docs` abierto (verificado: 200 sin auth), un atacante obtiene el mapa completo de las 144 rutas *y* las credenciales para recorrerlas. Y en paralelo, la clave JWT en la historia de git permite forjar tokens sin ni siquiera registrarse.

Ninguna de las tres mitigaciones supera S de esfuerzo. Todas son ejecutables hoy. Por eso preceden a la infraestructura de CI: no dependen de ella y el reloj corre.

## Por qué CI va antes que cualquier feature nueva

No es dogma de proceso, es aritmética de este repo. Hoy `mvn test` falla en compilación por dos ficheros, y en Maven un fallo en `test-compile` **aborta el módulo entero**. Los ~176 `@Test` existentes —incluido el `JwtServiceKeyTest` añadido en la remediación de hoy— **no se ejecutan nunca**. No hay cobertura baja: hay cobertura **cero efectiva**.

Y sobre esa cobertura cero, la Fase 1 propone exactamente el tipo de cambio que rompe cosas en silencio: modificar la cadena de filtros de seguridad, añadir 23 anotaciones `@Transactional`, **reescribir el modelo de autorización entero de 197 endpoints** y desactivar `open-in-view`. Ninguno de esos cambios falla al compilar cuando está mal; todos fallan en ejecución, en producción, semanas después.

El coste de T0.7 + T0.8 es de 1-2 días. El coste de una regresión de autorización en un backoffice que ya está vivo es de otro orden.

Hay un segundo argumento: **el incidente de Flyway ya demostró el fallo del modo actual**. Flyway nunca se ejecutó en ningún entorno y nadie lo supo hasta la auditoría. Un job que arranque el contenedor contra un Postgres limpio (T0.9) lo habría cazado en el primer push. Esa clase de fallo —el que solo aparece en entorno limpio— se repetirá; CI es lo único que lo detecta.

## Por qué reparar los tests precede a estabilizar el backend

Parece limpieza pospuesta. No lo es, por tres razones.

**Mecánica:** mientras no compilen, *ningún* test del módulo se ejecuta. Reparar dos ficheros no recupera dos tests, recupera 176. Es la mejor relación beneficio/coste del plan.

**Informativa:** el commit de tests `ca838778` es anterior al refactor `d497573f`. Los tests no están desactualizados: describen el contrato que el refactor rompió. Llaman a `findByIdAndTenantId` porque el filtrado por tenant *debería* estar en el repositorio — y el refactor lo eliminó, dejando servicios que reciben un `tenantId` que ignoran. **El test roto es el hallazgo de seguridad**, escrito antes de que existiera el fallo.

**De secuencia:** la Fase 1 no son features aisladas, es cirugía transversal. `open-in-view: false` es el caso canónico: una línea de configuración cuyo efecto es destapar `LazyInitializationException` en endpoints arbitrarios. Sin suite verde antes y después, ese cambio no es verificable, solo desplegable y esperanzado. Por eso está deliberadamente colocado como **última** tarea de su fase.

## Por qué los permisos van en la Fase 1 y no más tarde

Podría parecer una feature de administración, y por tanto material de la Fase 3 junto a su pantalla. No lo es, por dos razones.

**Es un agujero de seguridad, no una comodidad.** De los 197 endpoints, **58 no tienen ninguna anotación** y quedan al alcance de cualquier usuario autenticado: los 19 de inventario (incluido confirmar una sesión y ajustar stock), los 11 de factura de venta (emitir, cobrar, anular, borrar) y los 15 de presupuestos. En un ERP eso significa que cualquiera con una cuenta puede modificar stock y emitir facturas.

**Y el modelo actual no es "grueso", es inconsistente.** Las anotaciones nombran roles que no existen en el enum (`EMPLOYEE` en ~70 endpoints, `APPROVER` y `AUDITOR` en compliance). El efecto medible es doble: el rol `USER` **no supera ni una sola anotación** de la aplicación —el sistema es de facto binario ADMIN/MANAGER— y los endpoints de compliance son **inalcanzables para todos**, lo que explica por qué llevan meses sin que nadie note que están mock.

Ninguna de las dos cosas se arregla "de paso". Y arreglarlas *después* de construir las pantallas de la Fase 3 significaría reescribir esas pantallas cuando el modelo cambie. El orden correcto es: modelo en la Fase 1, pantalla de administración en la Fase 3.

**Corolario sobre T2.6:** cerrar el cruce de tenants no es multitenancy, es higiene. En `retail-api` hay 35 repositorios que extienden `TenantAwareRepository` y `withTenant(...)` no lo invoca **ningún** servicio; `Product.tenantId` admite nulos. Heredar la interfaz no filtra nada. Es barato hacerlo en la Fase 2, cuando ya se está tocando la capa de repositorio, y caro después.

## Por qué la sinceridad del producto va antes que construir funcionalidad

La Fase 3 empieza por retirar humo y purgar datos falsos (3.A) antes de construir nada (3.B en adelante). Es deliberado.

El dashboard actual **no está vacío: está mintiendo**. Las variaciones de ingresos, pedidos y clientes son `Math.random()`; los resúmenes de depósito y movimientos de stock son inventados; y los 7 gráficos de analytics caen a datos mock ante cualquier error del backend, sin avisar. Mientras eso siga ahí, **cualquier decisión de negocio tomada mirando el producto está tomada sobre ruido** — y peor, cualquier evaluación de si las funciones nuevas sirven será igual de poco fiable.

Retirar del menú lo que no se va a construir tiene la misma lógica y cuesta una tarea S: pasa de 15 entradas fantasma a 6, sin escribir funcionalidad. Y conectar al menú las tres pantallas de facturas ya terminadas y los dos formularios huérfanos (771 líneas escritas) entrega valor real el primer día de la fase.

## Por qué consolidar facturas va antes que la completitud funcional

`InvoiceController` y `PurchaseInvoiceController` coexisten porque el refactor de separación Sales/Purchase quedó a medias — y el backoffice consume ambos. Las pantallas de recibos y pagos (T3.5) y todo el módulo contable (3.D) se apoyan en el modelo de factura: construirlos sobre un dominio bifurcado obliga a elegir a qué mitad conectarse y luego migrar.

El caso del Libro IVA lo ilustra: necesita el desglose por alícuota, que **solo `Invoice` tiene**. Si la consolidación fuera al revés, el módulo contable habría nacido sin datos.

Hay además coste hundido: T2.1 y T2.6 tocan los mismos ficheros. Juntas son un refactor; separadas son dos.

## Por qué la integración con el portal se difiere del todo

Es la decisión de alcance más importante de esta revisión, y es correcta por una razón simple: **`retail-api` todavía no es un buen backend de nada**. Tiene 58 endpoints sin autorización, un dominio de factura duplicado, consultas que cruzan tenants y cero cobertura de tests ejecutable. Conectarle un ecommerce en producción en ese estado propaga cada uno de esos problemas a un sistema que sí tiene clientes.

Además, el portal **no está esperando**: hoy funciona contra su ERP externo y no está bloqueado por RetailManager. No hay urgencia que justifique adelantar la convergencia.

Lo que sí importa es no cerrarse puertas. Por eso la Fase 5 está documentada aunque no se ejecute: las tres restricciones que las Fases 1-3 deben respetar son no duplicar en `retail-api` lo que el portal ya resuelve (pedido, carrito, pagos, búsqueda, CMS), cerrar el cruce de tenants antes de pensar en superficie pública, y mantener `inventory/` capaz de responder stock por sucursal — que es justo la deuda nº1 que el portal tiene contra su ERP actual.

## Por qué el design system va al final

No bloquea funcionalidad (nadie deja de vender porque haya tres primarios), es completamente reversible (los tokens son CSS, no esquema de datos), y unificar antes de escribir pantallas nuevas significa tocarlas dos veces.

Con el portal fuera de este repo, además, el caos de tokens queda confinado a **una sola app**: el backoffice, donde de tres primarios solo uno se usa en runtime y otro tiene cero usos confirmados. Eso lo convierte en una eliminación de código muerto, no en una negociación de marca — y por eso es barato y puede esperar.

---

# Grafo de dependencias

```
T0.4 ──> T0.3                            (auditar usuarios antes de cerrar el registro)
T0.6 ──> T2.0 ──> T2.1                   (no tocar datos de factura sin backup probado)

T0.7 ──> T0.8 ──> T0.10 ──> [puerta de calidad de todas las fases siguientes]
  │        └──> T0.9 ──> T0.11
  └──> [habilita] Fase 1 completa        (sin suite verde, la Fase 1 es a ciegas)

T1.A1 ──> T1.A2 ──> T1.A3 ──> T1.A4 ──> T1.9      (matriz -> modelo -> authorities -> anotar -> verificar)
   └──> T1.A8 (frontend)  ──> T3.9 + T3.11         (la UI de permisos necesita el modelo)
T1.A7 ──────> T3.10                                (el visor de auditoría necesita el aspecto AOP)
T1.5 + T1.9 ──> T1.10                              (open-in-view solo tras transacciones y tests)

T2.1 ──> T2.2 ──> T2.3 ──> T2.4 ──> T2.5           (portar -> completar -> testear -> retirar -> borrar tabla)
T2.9 ──────> T4.6
T0.7(opción b) ──> T2.6                            (cruce de tenants; prerrequisito de 4.A y de la Fase 5)

Fase 2 ──> T3.5   (recibos/pagos sobre un dominio de factura ya unificado)
Fase 2 ──> 3.D    (el Libro IVA necesita el desglose por alícuota que solo `Invoice` tiene)
T3.1 + T3.2 + T3.3 ──> [resto de la Fase 3]        (sinceridad primero: no construir sobre humo)
T3.12 ──> T3.13..T3.16                             (alcance contable decidido antes de codificar)
T2.8 ──> T3.17                                     (no conectar a la UI endpoints que devuelven mock)

Fase 3 ──> Fase 5                                  (no conectar un portal a un backend que aún no es sólido)
T2.6 + 4.A ──> Fase 5                              (aislamiento real antes de superficie pública)
```

**Ruta crítica al MVP operable:** `T0.3 → T0.7 → T0.8 → T1.A1 → T1.A2 → T1.A4 → T1.9 → T1.10`
**Ruta crítica al producto completo:** `T2.1 → T2.3 → T3.1 → T3.5 → T3.8 → 3.D`

**Paralelizable con dos personas:**
- Backend: 0.B → 1.A backend → 1.B → Fase 2 → 3.D backend
- Frontend: 3.A (sinceridad, no depende de nada) → T1.A8 → 3.B/3.C en cuanto exista el modelo de permisos

---

# Antipatrones a evitar

1. **Arreglar T0.7 por la vía rápida.** Adaptar el test a `findById` convierte un hallazgo de aislamiento en deuda invisible.
2. **Migrar los datos hacia `PurchaseInvoice`.** Es la dirección destructiva: se perdería el desglose fiscal argentino, las cuatro retenciones y los conceptos no-producto. La dirección correcta es traer 4-5 campos al modelo que ya está integrado.
3. **Dejar los `Math.random()` "para después".** Mientras sigan ahí, ninguna métrica del producto es fiable — incluida la que usarías para decidir si lo demás funciona.
4. **Construir pantallas nuevas antes de retirar las falsas.** Retirar 9 entradas fantasma del menú cuesta una tarea S y mejora el producto más que una pantalla nueva.
5. **Anotar los 58 endpoints desnudos sin tener antes la matriz (T1.A1).** Salen 58 decisiones improvisadas y contradictorias — que es exactamente cómo aparecieron `EMPLOYEE`, `APPROVER` y `AUDITOR`.
6. **Meter el cambio de permisos y `open-in-view` en el mismo despliegue.** Dos fuentes simultáneas de 403/500 y ningún modo de distinguirlas.
7. **Aplicar la CSP directamente en producción.** Report-Only en preview primero.
8. **Adelantar la Fase 5 "porque el portal ya está".** El portal no está bloqueado por RetailManager; conectarlo a un backend con 58 endpoints abiertos y sin tests propaga cada problema a un sistema que sí tiene clientes.
9. **Construir en `retail-api` lo que el portal ya resuelve** (pedido, carrito, pagos, búsqueda full-text, CMS) por si algún día hace falta. Cuando llegue la Fase 5, la frontera se decide primero.

---

# Verificación

**Fase 0**
```bash
cd backend/erphub-api && ./mvnw -f microservices/pom.xml -B -pl retail-api -am verify
curl -s -o /dev/null -w "%{http_code}\n" https://retail-api-production-88b1.up.railway.app/v3/api-docs   # esperado: 401/404
curl -s -o /dev/null -w "%{http_code}\n" https://retail-api-production-88b1.up.railway.app/actuator/health # esperado: 200
```
Más: intentar un alta pública y comprobar que no otorga `ADMIN`; firmar un JWT con la clave antigua y comprobar 401; restaurar el backup en un entorno de prueba.

**Fase 1** — el test de autorización recorre los 197 endpoints y ninguno queda sin permiso declarado; `grep -rE "EMPLOYEE|APPROVER|AUDITOR"` → 0 resultados; T1.A5 verde (ninguna authority huérfana); un usuario de mostrador puede operar de verdad y no ve lo que no le toca; test de una sola pasada por la cadena de filtros; `curl -I https://retail.zaphirio.com` con HSTS y CSP; recorrido manual del backoffice sin regresiones.

**Fase 2** — `/api/v1/purchase-invoices` devuelve 404/410 en el OpenAPI desplegado; conciliación de conteos y sumas antes/después de la migración; el ingreso de stock desde factura, la cuenta corriente de proveedor y el módulo de compliance siguen funcionando; los tests portados de `PurchaseInvoiceServiceTest` pasan ahora contra `InvoiceServiceImpl`.

**Fase 3**
```bash
grep -rn "Math.random\|getMock" frontend/web-client/src/app/core/services/   # esperado: sin resultados
grep -rn "EnConstruccion" frontend/web-client/src/app/app.routes.ts          # solo lo que se decidió conservar
cd frontend/web-client && npm run lint && npm test -- --watch=false
```
Más, en producción: emitir una factura, registrar el cobro y verlo reflejado en la cuenta corriente y en la caja; invitar a un usuario, asignarle un rol y comprobar que solo ve lo suyo; cuadrar el Libro IVA de un período real contra las facturas de ese período.

**Fase 5** — no aplica todavía. Su criterio de entrada es el DoD de la Fase 3, no una fecha.
