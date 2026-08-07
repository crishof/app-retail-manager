# FASE 5 — Diagnóstico de GAP Veri*factu (España)

> **Alcance:** Documento de SOLO diagnóstico. No se diseña ni se implementa la solución.
> Todas las afirmaciones se han verificado leyendo el código real. Se cita `archivo:línea`.
> Ruta base backend (abreviada como `…/retailapi` en las citas):
> `backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi`
> Migraciones: `backend/erphub-api/microservices/retail-api/src/main/resources/db/migration`

---

## Corrección del supuesto de partida

El prompt original asumía que **NO existe facturación**. Esto es **parcialmente falso**.
Existe una infraestructura de facturación y "compliance fiscal" ya construida (aparentemente
resultado de un refactor en fases: los comentarios mencionan "Phase 4"/"Phase 5"). Sin embargo,
esa infraestructura está orientada mayoritariamente a **AFIP (Argentina)** y **no** a Veri*factu
(España), presenta piezas Spain-ready a medias, y **contiene endpoints con datos simulados
(mock)**. Ninguna pieza implementa el núcleo de Veri*factu (encadenamiento, huella de registro,
QR, remisión AEAT).

**Observación de coherencia geográfica (importante):** el modelo mezcla dos regímenes fiscales:
- Piezas **España**: `InvoiceDocumentType` (FACTURA/NOTA_CREDITO/…), `InvoiceTaxRate` (IVA 21/7/0),
  numeración `001/2026`, `Customer.taxId`.
- Piezas **Argentina/AFIP**: `TaxRegime` (Monotributista, IVA Responsable…), `TaxComplianceService`
  (validación de CUIT módulo 97, formato `SSSS-NNNNNNNN`, retenciones SUSS/IIBB), y campos
  `netValue105/vat105/withholdingSuss/…` en `Invoice` y `Sale`.

Esto significa que la "validación de cumplimiento fiscal" existente valida reglas argentinas,
no españolas, y **no sirve tal cual** para Veri*factu.

---

## 1. ¿Existe funcionalidad de facturación / ticket de venta? — SÍ (parcial)

### 1.1 Entidades de factura

| Entidad | Tabla | Fichero | Rol |
|---|---|---|---|
| `Invoice` | `tbl_supplier_invoice` | `…/operation/invoice/model/Invoice.java:24` | Factura de **compra** (proveedor); modelo "legacy" con todos los campos AFIP |
| `SalesInvoice` | `tbl_sales_invoices` | `…/operation/invoice/model/SalesInvoice.java:33` | Factura de **venta** (comprobante emitido a cliente) |
| `PurchaseInvoice` | `tbl_purchase_invoices` | `…/operation/invoice/model/PurchaseInvoice.java` | Factura de compra (jerarquía nueva) |
| `SalesInvoiceItem` / `PurchaseInvoiceItem` / `InvoiceItem` / `OtherConcept` | — | `…/operation/invoice/model/` | Líneas de factura y conceptos |
| `SupplierPayment` | — | `…/operation/invoice/model/SupplierPayment.java` | Pagos a proveedor |

Controllers: `SalesInvoiceController`, `PurchaseInvoiceController`, `InvoiceController`,
`FiscalComplianceController` (`…/operation/invoice/controller/`).
Migración de separación ventas/compras: `V4__Refactor_Invoice_Hierarchy_Sales_Purchase_Separation.sql`
(crea `tbl_invoices`, `tbl_sales_invoices`, `tbl_purchase_invoices`,
`tbl_sales_invoice_items`, `tbl_purchase_invoice_items`, `tbl_invoice_document_types`).

**Nota:** `SalesInvoice` (venta) **NO** tiene los campos de inmutabilidad/finalización fiscal
(`finalizationStatus`, `finalizedAt`, `@ImmutableField`). Esos campos solo están en `Invoice`
(la factura de **compra/proveedor**), ver `Invoice.java:86-112`. Es decir, **la máquina de
inmutabilidad fiscal está cableada a la factura de compra, no a la de venta** — que es
precisamente la que Veri*factu regula.

### 1.2 Estados

Existen **dos** enums de estado distintos, aplicados a entidades distintas:

- `DocumentFinalizationStatus` (`…/shared/fiscal/DocumentFinalizationStatus.java:12`):
  `DRAFT → PENDING_APPROVAL → APPROVED → FINALIZED → CANCELED`. Es el ciclo de vida "fiscal"
  (finalización/inmutabilidad). Máquina de transiciones en `canTransitionTo()` (línea 75) y flag
  `editable` por estado (línea 58). **Solo se usa en `Invoice` (compra).**
- `InvoiceStatus` (`…/shared/fiscal/InvoiceStatus.java:10`): estado operativo
  `DRAFT/ISSUED/PENDING_PAYMENT/PARTIALLY_PAID/PAID/CANCELLED/OVERDUE`. Es el que usa `SalesInvoice`
  (`SalesInvoice.java:101`), junto a un `PaymentStatus` propio (`SalesInvoice.java:106`).

### 1.3 Inmutabilidad

- `@ImmutableField` (`…/shared/fiscal/ImmutableField.java:17`): anotación de marcado con
  `editableBeforeFinalization`. Aplicada en `Invoice` a `taxRegime`, `finalizedAt`,
  `finalizedByUserId` (`Invoice.java:88,104,111`).
- `InvoiceImmutabilityService` (`…/shared/fiscal/InvoiceImmutabilityService.java:20`): lógica de
  validación de transición (`validateStatusTransition:52`), bloqueo de edición
  (`validateModifiableStatus:31`), bloqueo de campo inmutable
  (`validateFieldModification:106`), `finalizeInvoice:153`, `cancelInvoice:187`.

  **¿Impide realmente modificar facturas finalizadas?** Parcialmente y con salvedades:
  - Es un servicio de **validación imperativa**: solo protege si el código de escritura lo invoca.
    No es un mecanismo declarativo a nivel de persistencia (no hay `@PreUpdate`/interceptor JPA que
    lo fuerce). `validateFieldModification` recibe `hasImmutableAnnotation` como **parámetro
    booleano** (línea 111): **no hay reflexión que lea la anotación automáticamente**; quien llame
    debe pasar el valor correcto. Nada garantiza que todos los `save()` pasen por aquí.
  - `SalesInvoice` (la factura de venta) **no tiene** `finalizationStatus`, así que este servicio
    **no la protege**.

- **Encadenamiento/huella:** `DocumentVersion` (`…/shared/audit/DocumentVersion.java:38`) +
  `DocumentVersioningService` (`…/shared/audit/DocumentVersioningService.java:31`):
  - Guarda snapshots JSON versionados por documento (`versionNumber`, `documentSnapshot`).
  - Calcula **SHA-256 del snapshot** (`snapshotHash`, `calculateHash():292`; columna
    `snapshot_hash VARCHAR(64)` en `V2__create_audit_and_versioning_tables.sql:48`).
  - Verifica integridad recomputando el hash (`verifyVersionIntegrity():239`).
  - **PERO:** el hash es **por-versión aislado**. No existe campo `previousHash` ni referencia al
    hash del registro anterior → **NO hay cadena (encadenamiento registro anterior→actual)**. Ver
    entidad completa `DocumentVersion.java` (campos: solo `snapshotHash`, ningún `previousHash`).

- `AuditService` / `AuditLog` (`…/shared/audit/AuditService.java:33`,
  `…/shared/audit/AuditLog.java:35`): traza de eventos (CREATE/UPDATE/DELETE/FINALIZE/CANCEL) con
  `changes` JSON, usuario, timestamp, flag `isForFinalizedDocument`. La entidad se documenta como
  "inmutable" (comentario `AuditLog.java:23`) pero **la inmutabilidad no está forzada** (es una
  tabla JPA normal; no hay trigger/constraint que impida UPDATE/DELETE). `AuditLog` **tampoco**
  tiene hash ni encadenamiento.

### 1.4 Numeración / series

- `SalesInvoice.number` (`SalesInvoice.java:69`): `VARCHAR(20)`, formato documentado `001/2026`.
- **No existe generación secuencial en servidor.** El número se toma **directamente del request**:
  `SalesInvoiceMapper.java:75` → `.number(request.getNumber())`. No hay tabla de secuencias/contador
  ni lógica `MAX(number)+1` (búsqueda de `sequence/counter/folio/serie` en migraciones y en
  `SalesInvoiceServiceImpl.java`: **sin resultados**). Índice `idx_invoices_number` existe
  (`V4…sql:66`) pero **sin restricción UNIQUE** sobre `(number, tenant_id)`.
- La validación de secuencialidad que existe (`TaxComplianceService.validateSequentialNumbering():208`)
  es de **formato AFIP** (`SSSS-NNNNNNNN`), no del formato español `NNN/AAAA`, y **no se invoca**
  en el flujo de creación de `SalesInvoice`.

### 1.5 Tipos de documento

- `InvoiceDocumentType` (`…/shared/fiscal/InvoiceDocumentType.java:13`): **España** —
  `FACTURA`, `NOTA_CREDITO`, `NOTA_DEBITO`, `RESGUARDO`, con flags `requiresSequentialNumbering`,
  `applicableToPurchase`, `affectsStock`. Bien orientado a España.
- En `SalesInvoice` el tipo se almacena como **`String`** (`documentType`, `SalesInvoice.java:76`),
  **no** como el enum → sin garantía de integridad referencial con `InvoiceDocumentType`.
- Tabla catálogo `tbl_invoice_document_types` con seed (`V4…sql:165-171`).

### 1.6 IVA / impuestos

- `InvoiceTaxRate` (`…/shared/fiscal/InvoiceTaxRate.java:13`): **España** — `STANDARD 21%`,
  `REDUCED 7%`, `ZERO 0%`. (Nota: falta el tipo **reducido 10%** y el **superreducido 4%**
  vigentes en España; solo modela 21/7/0.)
- `TaxRegime` (`…/shared/fiscal/TaxRegime.java:9`): **Argentina** — Monotributista, IVA Responsable,
  etc., con tipos `{0, 10.5, 21, 27}`. Es el que referencia `Invoice.taxRegime` (`Invoice.java:89`)
  y el que valida `TaxComplianceService`.
- `TaxComplianceValidator` (`…/shared/fiscal/TaxComplianceValidator.java:33`): anotación que marca
  el método de finalización; la procesa `InvoiceFinalizationService.finalizeInvoice()` invocando
  `TaxComplianceService.validateInvoiceCompliance(invoice)` (`InvoiceFinalizationService.java:95`).
  La validación real (`TaxComplianceService.validateInvoiceCompliance(Invoice):314`) hoy solo
  comprueba que exista `taxRegime` y que los tipos de IVA de las líneas sean válidos **para el
  régimen argentino**.
- `TaxComplianceException` (`…/shared/fiscal/TaxComplianceException.java`): excepción con
  `validationField`.

### 1.7 Orquestación de finalización (lo más "Veri*factu-adyacente" que hay)

`InvoiceFinalizationService.finalizeInvoice()` (`…/operation/invoice/service/InvoiceFinalizationService.java:83`)
encadena: validar transición → validar compliance → crear snapshot versionado → marcar
`FINALIZED` + `finalizedAt`/`finalizedByUserId` → registrar en auditoría → bloquear versión.
**Solo opera sobre `Invoice` (compra), no sobre `SalesInvoice`.**

⚠️ **Endpoints con datos simulados:** en `FiscalComplianceController`, los endpoints
`/audit-trail` (`FiscalComplianceController.java:155`) y `/versions`
(`FiscalComplianceController.java:194`) **devuelven datos hardcodeados/mock** (los propios
comentarios dicen "mock implementation … Phase 5 will implement", líneas 161-162 y 200-201). No
consultan `AuditService`/`DocumentVersioningService` reales.

---

## 2. Entidades de dominio que mapearían a una futura factura Veri*factu

| Concepto Veri*factu | Entidad actual | Fichero | Idoneidad |
|---|---|---|---|
| Operación de venta | `Sale` (`tbl_sales`) | `…/operation/sales/model/Sale.java:18` | Base OK. Relación 1:1 con `SalesInvoice` vía `Sale.salesInvoiceId` (`Sale.java:35`) y `SalesInvoice.saleId` (`SalesInvoice.java:44`). Campos de impuestos son **AFIP** (`netValue105/vat105/withholdingSuss/…`), no España. |
| Líneas de venta | `SaleItem`, `SalesInvoiceItem` | `…/operation/sales/model/SaleItem.java`, `…/operation/invoice/model/SalesInvoiceItem.java` | Base OK; hay que confirmar desglose por tipo de IVA por línea. |
| Factura emitida | `SalesInvoice` | `…/operation/invoice/model/SalesInvoice.java:33` | Base OK como cabecera, pero **le faltan** los campos fiscales de inmutabilidad/finalización y todos los campos Veri*factu (hash, huella, QR, estado de envío). |
| Cliente / destinatario | `Customer` (`tbl_customers`) | `…/party/customer/model/Customer.java` | Tiene `taxId` (línea 30) y `dni` (línea 28). Aprovechable como NIF destinatario. Falta modelar tipo de identificación y país (IDType/NIF-IVA para no residentes). |
| Producto | módulo `product` / `ProductServiceClient` | `…/shared/client/ProductServiceClient.java` | Existe vía microservicio; suficiente para descripción de línea. |
| Presupuesto | `quote` (`operation/quote`) | `…/operation/quote/` | No es factura; posible origen de venta. |
| TPV / Caja | `cash` (`operation/cash`) | `…/operation/cash/` | Relevante para **tickets** (RESGUARDO / factura simplificada), que también entran en Veri*factu. |
| Emisor (obligado tributario) | **NO EXISTE** entidad de empresa emisora con NIF | — | **GAP**. `tenantId` identifica al inquilino, pero no hay entidad con NIF/razón social/domicilio fiscal del emisor. |

**Idoneidad general para alto volumen (ecommerce):** el modelo relacional (Sale ↔ SalesInvoice ↔
items, multi-tenant por `tenantId`) es una base razonable. Pero Veri*factu exige, por cada registro
de facturación, cómputo de huella y encadenamiento **en el momento de emisión** y, en modo Veri*factu,
remisión a AEAT. En alto volumen esto implica: contador secuencial sin huecos con concurrencia
controlada (hoy inexistente — el número viene del request), cola/reintentos de envío, e idempotencia.
Nada de eso está modelado.

---

## 3. Checklist de requisitos Veri*factu como GAP

Leyenda: **BASE** = existe algo aprovechable · **PARCIAL** = existe pero insuficiente/mal orientado ·
**GAP TOTAL** = no existe.

### (a) Registro/encadenamiento de eventos de facturación (hash encadenado anterior→actual)
**Estado: GAP TOTAL (con base parcial de versionado).**
- Aprovechable: `DocumentVersioningService` ya calcula SHA-256 de snapshots
  (`DocumentVersioningService.java:292`) y existe la tabla `tbl_document_version` con `snapshot_hash`.
- Falta todo el encadenamiento: **no hay `previousHash`/referencia al registro anterior** en
  `DocumentVersion.java` ni en `AuditLog.java`; no hay entidad "registro de facturación" con cadena.
  El hash actual es por-versión aislado, no una cadena inmutable de registros de facturación.

### (b) Huella / hash SHA-256 de cada registro de facturación
**Estado: PARCIAL.**
- Aprovechable: la primitiva SHA-256 ya existe y produce hex de 64 chars
  (`DocumentVersioningService.calculateHash():292`; columna `snapshot_hash VARCHAR(64)`,
  `V2…sql:48`).
- Falta: la huella no se calcula sobre el **conjunto de campos que exige el reglamento Veri*factu**
  (NIF emisor, número, fecha, tipo, importe total, cuota, huella del registro anterior…), sino sobre
  un snapshot arbitrario de campos elegidos ad hoc (ver `objectMapperToMap()` en
  `InvoiceFinalizationService.java:209`, que solo mete id/número/fecha/total/régimen/estado). No hay
  formato canónico normalizado ni se aplica a `SalesInvoice`.

### (c) Firma
**Estado: GAP TOTAL.**
- No hay ninguna firma electrónica/criptográfica. Búsqueda de `firma/signature/certificado` en
  `src/main`: sin resultados relevantes (solo referencias a "filter chain" de seguridad web). No hay
  gestión de certificados ni firma de registros.

### (d) Código QR en factura
**Estado: GAP TOTAL.**
- Sin generación de QR ni URL de cotejo AEAT. Búsqueda `qr/codigo_qr`: sin resultados.

### (e) Envío/remisión a AEAT (o modo "no Veri*factu" con conservación)
**Estado: GAP TOTAL.**
- Sin cliente/servicio AEAT, sin SOAP/REST a la Sede, sin cola de remisión, sin estados de envío,
  sin gestión de respuestas/errores AEAT, sin modo "no Veri*factu" formal. Búsqueda `aeat/verifactu`:
  sin resultados en el código.
- El "modo conservación" tampoco está: aunque hay versionado, no cumple los requisitos formales de
  registro Veri*factu.

### (f) Campos obligatorios (NIF emisor, tipo factura, desglose IVA)
**Estado: PARCIAL.**
- Aprovechable: tipo de factura (`InvoiceDocumentType`, España), tipos de IVA (`InvoiceTaxRate`
  21/7/0), NIF del **destinatario** vía `Customer.taxId` (`Customer.java:30`).
- Falta:
  - **NIF del emisor / obligado tributario**: no existe entidad emisora con NIF (GAP, ver §2).
  - **Desglose de IVA conforme a España**: `InvoiceTaxRate` no incluye 10% ni 4%; los campos de
    importe en `SalesInvoice` son un único `totalPrice` (`SalesInvoice.java:94`) — el desglose base/
    cuota por tipo vive en campos **AFIP** en `Sale`/`Invoice` (`netValue105/vat105/…`), no en un
    modelo de desglose español por tipo impositivo.
  - `documentType` en `SalesInvoice` es `String` libre, no enum validado.

### (g) Registro de eventos / anulaciones
**Estado: PARCIAL.**
- Aprovechable: `AuditService.logFinalization()`/`logCancellation()`
  (`AuditService.java:132,158`) y `AuditAction` (CREATE/UPDATE/DELETE/FINALIZE/CANCEL); flujo de
  cancelación en `InvoiceFinalizationService.cancelInvoice():184` y endpoint
  `FiscalComplianceController.java:107`.
- Falta: el concepto Veri*factu de **registro de anulación** encadenado (con su propia huella y
  enlace al registro anulado), y el registro de eventos técnico del sistema (SIF) que exige el
  reglamento. La auditoría actual es genérica, no un registro de facturación normativo. Además, la
  cancelación opera sobre `Invoice` (compra), no sobre `SalesInvoice`.

### (h) Inalterabilidad y trazabilidad
**Estado: PARCIAL.**
- Aprovechable: máquina de estados con `FINALIZED` inmutable (`DocumentFinalizationStatus`),
  `InvoiceImmutabilityService`, versionado con hash de integridad, y traza de auditoría.
- Falta / debilidades:
  - Inmutabilidad **no forzada a nivel de persistencia** (es validación imperativa opcional; sin
    interceptor JPA/trigger BD). `validateFieldModification` depende de que el llamante pase el flag
    de anotación (`InvoiceImmutabilityService.java:106`).
  - `AuditLog` y `DocumentVersion` son tablas mutables sin protección BD (sin cadena, sin WORM).
  - No aplica a `SalesInvoice`.
  - Endpoints de trazabilidad devuelven **mock** (`FiscalComplianceController.java:161,200`).

---

## Resumen de GAP por ítem

| Ítem Veri*factu | Estado | Base aprovechable |
|---|---|---|
| (a) Encadenamiento anterior→actual | **GAP TOTAL** | Versionado+SHA256 (sin cadena) |
| (b) Huella SHA-256 por registro | PARCIAL | `calculateHash()` existe; formato no normativo |
| (c) Firma | **GAP TOTAL** | Nada |
| (d) QR en factura | **GAP TOTAL** | Nada |
| (e) Remisión AEAT / modo conservación | **GAP TOTAL** | Nada |
| (f) Campos obligatorios (NIF emisor, tipo, desglose IVA) | PARCIAL | Tipos doc/IVA España, NIF cliente; falta NIF emisor y desglose ES |
| (g) Registro de eventos/anulaciones | PARCIAL | `AuditService`, flujo cancelación |
| (h) Inalterabilidad y trazabilidad | PARCIAL | Estados+inmutabilidad+versionado (no forzados en BD; no aplican a venta) |

**Conclusión:** hay andamiaje fiscal genérico reutilizable (estados, inmutabilidad, versionado con
hash, auditoría), pero está orientado a AFIP, cableado a la factura de **compra** y no a la de
**venta**, y **no implementa ninguna de las cuatro piezas nucleares de Veri*factu**
(encadenamiento de registros, huella normativa, firma, QR/remisión AEAT).
