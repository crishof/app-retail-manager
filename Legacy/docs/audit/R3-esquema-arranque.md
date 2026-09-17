# R3 — El backend no arranca en un entorno limpio (esquema/Flyway)

> Diagnóstico verificado **estática y empíricamente** el 2026-07-16. Bloqueante de despliegue.
> Relacionado: [07-despliegue](07-despliegue.md), [03-multitenancy-gap](03-multitenancy-gap.md), [REMEDIACION](REMEDIACION.md).

## Síntoma
En una base de datos **vacía** con el perfil `prod`, el arranque falla: Flyway no puede materializar el esquema.

## Mecanismo (causa raíz)

1. **`ddl-auto` divergente por perfil:**
   - `dev`/`docker`: `ddl-auto: update` → Hibernate **crea** las tablas base automáticamente (`application-dev.yml:28`, `application-docker.yml:28`).
   - `prod`: `ddl-auto: validate` → Hibernate **no crea nada**, solo valida (`application-prod.yml:29`).
2. **Las migraciones Flyway no crean las tablas base.** Recuento en `db/migration/`:
   | Migración | CREATE TABLE | ALTER TABLE |
   |---|---|---|
   | `V1__Add_tenant_multi_tenancy_support.sql` | 0 | 18 |
   | `V2__create_audit_and_versioning_tables.sql` | 2 | 2 |
   | `V3__Refactor_User_FullName...` | 0 | 2 |
   | `V4__Refactor_Invoice_Hierarchy...` | 6 | 2 |

   V1 y V3 **solo alteran** tablas (`ALTER TABLE tbl_users ...`) que **nadie crea** vía migración. Existían solo porque Hibernate (`ddl-auto: update`) las había creado antes en dev.
3. **Orden de arranque:** Spring Boot ejecuta **Flyway antes** que Hibernate. En una BD limpia, Flyway corre `V1` antes de que Hibernate pudiera crear nada.

**Resultado:** en una BD limpia, `V1` intenta `ALTER TABLE tbl_users ...` sobre una tabla inexistente → falla → el contexto no arranca. En `prod` (`validate`) no hay ningún mecanismo que cree las tablas base. **El sistema solo ha funcionado sobre BDs de desarrollo preexistentes** (creadas por Hibernate en ejecuciones previas); nunca desde cero.

## Evidencia empírica
Postgres 16 desechable y aislado, BD `retail_db` vacía, aplicando `V1`:
```
$ psql -U admin -d retail_db -v ON_ERROR_STOP=1 -f V1__Add_tenant_multi_tenancy_support.sql
ERROR:  relation "tbl_users" does not exist
```

## Problema secundario (config Flyway ignorada)
En `application.yaml` los bloques `flyway:` (`:30`) y `rabbitmq:` (`:77`) están al **nivel raíz**, fuera de `spring:`. Por tanto `spring.flyway.baseline-on-migrate: true`, `validate-on-migrate`, etc. **no se aplican**: Flyway corre con sus valores por defecto (`baseline-on-migrate=false`). Debe corregirse como parte de la solución (con cuidado: activar `baseline-on-migrate` sobre esquemas no vacíos altera qué migraciones se marcan como aplicadas).

## Acoplamiento con la decisión de tenancy
`V1` impone `tenant_id NOT NULL` en ~9 tablas, pero las entidades declaran `tenant_id` como `nullable=true` (ver [03-multitenancy-gap](03-multitenancy-gap.md)). Si el MVP es **mono-comercio**, esas restricciones y buena parte de `V1` sobran; si es **multi-comercio**, deben ampliarse a más tablas. Por eso el baseline de esquema **no puede fijarse sin decidir el modelo de tenancy** (paso 3 del plan).

## Opciones de solución

**Opción A — Squash a un único baseline (recomendada para pre-producción).**
No hay clientes ni BDs productivas reales. Generar un único `V1__baseline.sql` con el esquema **completo actual** derivado de las entidades JPA (verificado contra un Postgres limpio), eliminar V1–V4 previas, y mantener Flyway como única fuente de verdad. En `prod` se conserva `ddl-auto: validate`. Limpio y estándar; **descarta el histórico** de migraciones (ya roto).

**Opción B — Baseline incremental conservando V1–V4.**
Añadir un `V0__initial_schema.sql` que cree las tablas base tal como estaban **antes** de V1, y renumerar. Preserva el histórico, pero reconstruir el esquema histórico exacto es laborioso y propenso a error.

**Común a ambas:** corregir el namespace `spring.flyway`, y alinear `ddl-auto` (idealmente `validate` en todos los perfiles una vez el baseline es completo, para que dev también arranque desde cero de forma reproducible).

> Decisiones tomadas por el usuario (2026-07-16): (1) **mono-comercio** para el MVP; (2) **squash** (Opción A).

---

## Hallazgo adicional durante la corrección: Flyway NUNCA se ejecutaba

Al verificar el arreglo se descubrió la causa raíz de fondo: **Flyway jamás ha corrido en este proyecto**.
- Spring Boot 4 dividió las autoconfiguraciones en módulos separados. La clase `FlywayAutoConfiguration` vive ahora en el módulo `org.springframework.boot:spring-boot-flyway`, que **no estaba en el classpath** (solo `flyway-core` + `flyway-database-postgresql`).
- Sin ese módulo, `flyway-core` está presente pero **no se auto-ejecuta**: no se crea `flyway_schema_history` ni se aplican migraciones. Verificado: 0 menciones de Flyway en el arranque, 0 tablas creadas por migración.
- **Consecuencia:** el esquema se materializaba **exclusivamente** vía Hibernate `ddl-auto: update` en dev. Las migraciones V1–V4 eran **código muerto** que nunca se aplicó (lo que también explica por qué estaban incompletas/rotas sin que nadie lo notara).

## Resolución aplicada ✅

1. **Añadido el módulo de autoconfiguración de Flyway** (`spring-boot-flyway`) al `pom.xml` de `retail-api` → Flyway ahora sí se ejecuta al arrancar.
2. **Baseline squash:** generado `db/migration/V1__baseline_schema.sql` (42 tablas + 17 FKs + 41 índices) desde el modelo de entidades JPA (Hibernate schema export), verificado contra Postgres limpio. Eliminadas V1–V4 previas. Descarta de forma natural la divergencia muerta de V4 (`tbl_invoices`, `tbl_invoice_document_types`, sin entidad).
3. **Corregido el namespace** `spring.flyway` en `application.yaml` (estaba a nivel raíz, ignorado). `baseline-on-migrate: false`, `validate-on-migrate: true`.
4. **Alineado `ddl-auto: validate`** en dev y docker (antes `update`) → los tres perfiles tratan Flyway como única fuente de verdad; dev arranca desde cero de forma reproducible.

### Verificación de extremo a extremo (Postgres 16 limpio, aislado)
```
Flyway: Creating Schema History table "public"."flyway_schema_history" ...
Flyway: Migrating schema "public" to version "1 - baseline schema"
Flyway: Successfully applied 1 migration to schema "public", now at version v1 (00:00.183s)
-> flyway_schema_history: version=1, description="baseline schema", success=t
-> 43 tablas creadas (42 + flyway_schema_history)
-> Hibernate ddl-auto: validate  →  OK (el baseline coincide con las entidades)
-> ✅ "Started RetailApi" — arranque limpio desde una BD vacía
```

### Nota para desarrolladores con BD local previa
El `flyway_schema_history` antiguo (si existía) referencia migraciones eliminadas. **Elimina y recrea tu BD local** para partir del baseline. (En realidad, como Flyway nunca corrió, probablemente no exista ninguna `flyway_schema_history` previa.)

### Pendiente relacionado (no bloqueante)
- Los `@RabbitListener` intentan conectar al broker al arrancar (`Connection refused` si no hay RabbitMQ), pese a `rabbitmq.event-sync.enabled: false` — propiedad que **ningún código lee** (muerta). Revisar el guardado condicional de los listeners de AMQP para el despliegue sin RabbitMQ.
