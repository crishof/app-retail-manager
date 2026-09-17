# Especificación del Formulario de Factura de Proveedor

## Introducción
Este documento define la estructura, validaciones y requisitos para el formulario de creación de facturas de proveedor (Invoice Form) en la API de ERP Hub.

---

## Estructura del Formulario

### 1. **Sección: Datos del Proveedor**

| Campo | Tipo | Requerido | Validación | Placeholder |
|-------|------|-----------|-----------|-------------|
| `supplierId` | UUID | ✅ | No nulo | Seleccionar proveedor |
| `location` | String | ✅ | No vacío/en blanco | Ej: "Almacén A" |

---

### 2. **Sección: Información de Sucursal y Ubicación**

| Campo | Tipo | Requerido | Validación | Placeholder |
|-------|------|-----------|-----------|-------------|
| `branchId` | UUID | ✅ | No nulo | Seleccionar rama/sucursal |
| `locationId` | UUID | ✅ | No nulo | Seleccionar ubicación |

---

### 3. **Sección: Fechas**

| Campo | Tipo | Requerido | Validación | Placeholder |
|-------|------|-----------|-----------|-------------|
| `invoiceDate` | LocalDate | ✅ | No nulo | Fecha de factura (DD/MM/YYYY) |
| `dueDate` | LocalDate | ✅ | No nulo | Fecha de vencimiento (DD/MM/YYYY) |
| `receptionDate` | LocalDate | ❌ | - | Fecha de recepción (DD/MM/YYYY) |
| `savedDate` | LocalDate | ❌ | - | Fecha de guardado (DD/MM/YYYY) |

---

### 4. **Sección: Identificadores de Factura**

| Campo | Tipo | Requerido | Validación | Patrón | Placeholder |
|-------|------|-----------|-----------|--------|-------------|
| `invoiceType` | String | ✅ | No vacío/en blanco | Ej: "NF", "ND", "NC" | Tipo de factura |
| `invoicePrefix` | String | ✅ | No vacío/en blanco | Numérico | Ej: "001" |
| `invoiceNumber` | String | ✅ | No vacío/en blanco | Numérico | Ej: "123456" |
| `packingListPrefix` | String | ❌ | - | Numérico | Ej: "001" |
| `packingListNumber` | String | ❌ | - | Numérico | Ej: "123456" |

---

### 5. **Sección: Artículos (Tabla Dinámica)**

**Mínimo requerido:** 1 artículo

| Campo | Tipo | Requerido | Validación | Rango |
|-------|------|-----------|-----------|-------|
| `invoiceItemsRequest[].id` | UUID | ✅ | No nulo | - |
| `invoiceItemsRequest[].quantity` | Integer | ✅ | Positivo, > 0 | 1-999999 |
| `invoiceItemsRequest[].price` | Double | ✅ | Positivo, > 0 | 0.01-999999.99 |
| `invoiceItemsRequest[].taxRate` | Double | ✅ | No negativo, >= 0 | 0-100 |
| `invoiceItemsRequest[].discountRate` | Double | ✅ | No negativo, >= 0 | 0-100 |

---

### 6. **Sección: Opciones de Procesamiento**

| Campo | Tipo | Requerido | Validación | Descripción |
|-------|------|-----------|-----------|-------------|
| `saveStocks` | Boolean | ✅ | No nulo | Registrar movimiento de inventario |
| `taxSave` | Boolean | ✅ | No nulo | Guardar impuestos contables |
| `fixedAsset` | Boolean | ✅ | No nulo | ¿Es un activo fijo? |
| `askForPriceUpdate` | Boolean | ✅ | No nulo | ¿Solicitar actualización de precios? |

---

### 7. **Sección: Observaciones**

| Campo | Tipo | Requerido | Validación | Máximo |
|-------|------|-----------|-----------|--------|
| `observations` | String | ❌ | - | 500 caracteres |

---

### 8. **Sección: Resumen Financiero**

| Campo | Tipo | Requerido | Validación | Descripción |
|-------|------|-----------|-----------|-------------|
| `subtotal1` | Double | ✅ | >= 0 | Subtotal antes de descuentos |
| `discount` | Double | ❌ | >= 0 | Valor del descuento |
| `interest` | Double | ✅ | >= 0 | Intereses |
| `subtotal2` | Double | ✅ | >= 0 | Subtotal después de descuentos |

---

### 9. **Sección: Valores Netos e Impuestos IVA**

| Campo | Tipo | Validación | Descripción |
|-------|------|-----------|-------------|
| `netValue21` | Double | >= 0 | Valor neto al 21% |
| `vat21` | Double | >= 0 | IVA 21% |
| `netValue105` | Double | >= 0 | Valor neto al 10.5% |
| `vat105` | Double | >= 0 | IVA 10.5% |
| `netValue27` | Double | >= 0 | Valor neto al 27% |
| `vat27` | Double | >= 0 | IVA 27% |
| `netValue0` | Double | >= 0 | Valor neto al 0% (exento) |

---

### 10. **Sección: Impuestos Adicionales**

| Campo | Tipo | Validación | Descripción |
|-------|------|-----------|-------------|
| `internalTax` | Double | >= 0 | Impuesto interno |
| `withholdingVat` | Double | >= 0 | Retención de IVA |
| `withholdingSuss` | Double | >= 0 | Retención SUSS |
| `withholdingGrossReceiptsTax` | Double | >= 0 | Retención Ingresos Brutos |
| `withholdingIncome` | Double | >= 0 | Retención Ganancias |
| `stateTax` | Double | >= 0 | Impuesto Provincial |
| `localTax` | Double | >= 0 | Impuesto Municipal |

---

### 11. **Sección: Totalizaciones**

| Campo | Tipo | Validación | Descripción |
|-------|------|-----------|-------------|
| `rounding` | Double | >= 0 | Redondeo |
| `totalPrice` | Double | >= 0 | Monto total final |

---

## Reglas de Validación Global

1. **Campos Booleanos**: Todos los booleans (`saveStocks`, `taxSave`, `fixedAsset`, `askForPriceUpdate`) **DEBEN** tener un valor (`true` o `false`). **No pueden ser nulos**.

2. **Campos de Dinero**: Todos los campos numéricos deben seguir el formato de dos decimales máximo. Se recomienda usar `DecimalFormat` o similar en el frontend.

3. **UUIDs**: Los IDs debe ser válidos UUIDs v4. Validar en el frontend o dejar que el backend rechace IDs inválidos.

4. **Fechas**: 
   - `invoiceDate` no puede ser mayor que `dueDate`
   - `receptionDate` puede ser anterior, igual o posterior a `invoiceDate`

5. **Tabla de Artículos**:
   - Mínimo 1 artículo
   - Máximo 1000 artículos por factura (recomendado)
   - No pueden haber productos duplicados (validar en el frontend)

6. **Coherencia de Totales**: El backend **NO valida** la coherencia matemática (ej: `subtotal1 - discount ≠ subtotal2`). Es responsabilidad del **cliente (frontend)** calcular correctamente los totales antes de enviar.

---

## Respuestas de Error Esperadas

Cuando la validación falla, el servidor retorna un **HTTP 400 (Bad Request)** con detalles de error:

```json
{
  "timestamp": "2026-05-08T08:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "supplierId",
      "message": "El ID del proveedor es requerido"
    },
    {
      "field": "invoiceItemsRequest",
      "message": "Debe incluir al menos un artículo en la factura"
    },
    {
      "field": "saveStocks",
      "message": "saveStocks no puede ser nulo"
    }
  ]
}
```

---

## Ejemplo de Payload Válido

```json
{
  "supplierId": "550e8400-e29b-41d4-a716-446655440000",
  "location": "Almacén Principal",
  "branchId": "550e8400-e29b-41d4-a716-446655441111",
  "locationId": "550e8400-e29b-41d4-a716-446655442222",
  "invoiceDate": "2026-05-08",
  "dueDate": "2026-06-08",
  "receptionDate": "2026-05-09",
  "invoiceType": "NF",
  "invoicePrefix": "001",
  "invoiceNumber": "001234",
  "packingListPrefix": "002",
  "packingListNumber": "005678",
  "invoiceItemsRequest": [
    {
      "id": "550e8400-e29b-41d4-a716-446655443333",
      "quantity": 10,
      "price": 150.50,
      "taxRate": 21.0,
      "discountRate": 0.0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655444444",
      "quantity": 5,
      "price": 200.00,
      "taxRate": 10.5,
      "discountRate": 5.0
    }
  ],
  "saveStocks": true,
  "taxSave": true,
  "fixedAsset": false,
  "askForPriceUpdate": false,
  "observations": "Factura con impuestos incluidos",
  "subtotal1": 2500.00,
  "discount": 125.00,
  "interest": 0.0,
  "subtotal2": 2375.00,
  "netValue21": 1500.00,
  "vat21": 315.00,
  "netValue105": 875.00,
  "vat105": 91.88,
  "netValue27": 0.0,
  "vat27": 0.0,
  "netValue0": 0.0,
  "internalTax": 0.0,
  "withholdingVat": 0.0,
  "withholdingSuss": 0.0,
  "withholdingGrossReceiptsTax": 0.0,
  "withholdingIncome": 0.0,
  "stateTax": 0.0,
  "localTax": 0.0,
  "rounding": 0.0,
  "totalPrice": 2781.88
}
```

---

## Recomendaciones para el Desarrollo del Frontend

### Estructura de Componentes (Angular/React)

```
InvoiceForm/
├── ProviderSection.component
├── BranchSection.component
├── DateSection.component
├── InvoiceIdentifierSection.component
├── InvoiceItemsTable.component
├── ProcessingOptionsSection.component
├── FinancialSummarySection.component
├── TaxesSection.component
└── FormActions.component
```

### Validaciones en el Frontend

- **Todos los campos requeridos** deben validarse en tiempo real (on blur/on change)
- **Booleans**: Usar checkboxes o toggle switches con valor predeterminado
- **Fechas**: Mostrar datepickers, validar que `dueDate >= invoiceDate`
- **Números**: Usar input `type="number"` con formato de dos decimales
- **Tabla dinámmica**: Permitir agregar/eliminar filas con validación individual

### Cálculo de Totales

El frontend **DEBE calcular** automáticamente:
- `subtotal2 = subtotal1 - discount + interest`
- `totalPrice = subtotal2 + VAT + impuestos_adicionales - retenciones`

---

## Documentación OpenAPI

El endpoint está documentado en:
```
POST /api/v1/purchases
```

Acceder a Swagger UI en:
```
http://localhost:9012/swagger-ui.html
```

---

**Versión:** 1.0  
**Última actualización:** 2026-05-08  
**Autor:** ERP Hub Development Team

