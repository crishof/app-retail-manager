# Resumen de Cambios - Validación de Facturas de Proveedor

## Problema Original

Error al guardar factura de proveedor:
```
JSON parse error: Cannot map `null` into type `boolean` 
(set `DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES` to 'false' to allow)
```

**Causa:** Los campos booleanos en `InvoiceRequest` no podían recibir valores `null`.

---

## Solución Implementada

### 1. **Campos no pueden ser nulos** ✅
Se mantienen los booleanos como primitivos (`boolean`) en lugar de wrappers (`Boolean`), para forzar que siempre tengan un valor.

### 2. **Validaciones en el Backend** ✅

#### Cambios en `InvoiceRequest.java`:
- Agregadas anotaciones de validación Bean Validation:
  - `@NotNull` para campos requeridos (UUID, fechas, strings, booleans)
  - `@NotBlank` para strings que no deben estar vacíos
  - `@NotEmpty` para la lista de items
  - `@DecimalMin` para valores numéricos (>= 0)
  - `@Valid` para cascada de validación en items

#### Cambios en `InvoiceItemRequest.java`:
- `@NotNull` para todos los campos
- `@Positive` para cantidad (> 0)
- `@DecimalMin(value="0.0", inclusive=false)` para precio (> 0)
- `@DecimalMin` para tax rate y discount rate (>= 0)

#### Cambios en `InvoiceController.java`:
- Agregación de `@Valid` en `@RequestBody` para activar validaciones
- Ambos endpoints POST ahora validan automáticamente

### 3. **Documentación Completa** 📚

Se crearon dos archivos de documentación:

#### `FORM_INVOICE_SPECIFICATION.md`:
- Especificación completa del formulario
- Estructura de secciones
- Tabla de validaciones por campo
- Reglas de validación global
- Ejemplo de payload válido
- Recomendaciones para desarrollo del frontend

#### `INVOICE_REQUEST_EXAMPLES.md`:
- Ejemplos de cURL
- Collection Postman
- Ejemplos JavaScript/Fetch
- Código Angular/TypeScript
- Hook React/TypeScript
- Respuestas de error esperadas

---

## Cambios de Archivos

### Modificados:
1. `microservices/purchase-sv/src/main/java/com/crishof/purchasesv/dto/InvoiceRequest.java`
   - Agregadas anotaciones de validación
   - Agregado import de `jakarta.validation`

2. `microservices/purchase-sv/src/main/java/com/crishof/purchasesv/dto/InvoiceItemRequest.java`
   - Agregadas anotaciones de validación
   - Agregado import de `jakarta.validation`

3. `microservices/purchase-sv/src/main/java/com/crishof/purchasesv/controller/InvoiceController.java`
   - Agregado `@Valid` en ambos POST
   - Agregado import de `jakarta.validation.Valid`

### Creados:
1. `FORM_INVOICE_SPECIFICATION.md` - Especificación del formulario
2. `INVOICE_REQUEST_EXAMPLES.md` - Ejemplos de requests

---

## Comportamiento Nuevo

### Por la API (Backend)

**Request válido:**
```bash
curl -X POST http://localhost:9012/api/v1/purchases \
  -H "Content-Type: application/json" \
  -d '{ ... datos válidos ... }'
```
✅ **Respuesta:** HTTP 201 CREATED + datos de la factura creada

**Request con campos nulos/inválidos:**
```bash
curl -X POST http://localhost:9012/api/v1/purchases \
  -H "Content-Type: application/json" \
  -d '{ "saveStocks": null, "invoiceItemsRequest": [] }'
```
❌ **Respuesta:** HTTP 400 BAD REQUEST con detalles de errores

```json
{
  "timestamp": "2026-05-08T08:00:00Z",
  "status": 400,
  "error": "Validation failed",
  "errors": [
    {
      "field": "saveStocks",
      "message": "saveStocks no puede ser nulo"
    },
    {
      "field": "invoiceItemsRequest",
      "message": "Debe incluir al menos un artículo en la factura"
    }
  ]
}
```

---

## Implementación del Frontend

Para validar en el frontend **antes de enviar al backend**, usar cualquiera de los ejemplos en `INVOICE_REQUEST_EXAMPLES.md`:

### React (Recomendado):
```typescript
const { errors, validateInvoice } = useInvoiceValidation();

if (!validateInvoice(invoice)) {
  console.error('Errores encontrados:', errors);
  // Mostrar errores en el formulario
  return;
}
```

### Angular:
```typescript
invForm: FormGroup = this.fb.group({
  saveStocks: [false, Validators.required],
  taxSave: [false, Validators.required],
  // ... más campos
});

if (invForm.valid) {
  this.submitInvoice(invForm.value);
}
```

### Vanilla JavaScript:
```javascript
const validar = (invoice) => {
  if (!invoice.supplierId) throw new Error('ID proveedor requerido');
  if (!invoice.saveStocks === null) throw new Error('saveStocks requerido');
  // ... más validaciones
};
```

---

## Testing

### Verificar API con curl:

**Test 1 - Factura válida:**
```bash
bash create_valid_invoice.sh
```

**Test 2 - Factura con errores:**
```bash
bash create_invalid_invoice.sh
```

**Test 3 - Verificar en Swagger:**
```
http://localhost:9012/swagger-ui.html
POST /api/v1/purchases
```

---

## Notas Importantes

1. **Los booleans son obligatorios**: Siempre enviar `true` o `false`, nunca `null`
2. **Los items son obligatorios**: Mínimo 1 artículo por factura
3. **Los números no pueden ser negativos**: Excepto `discount` que no tiene restricción
4. **Las fechas pueden ser nulas**: `receptionDate` y `savedDate` son opcionales
5. **El backend NO valida coherencia de totales**: Es responsabilidad del cliente calcular correctamente

---

## Checklist de Implementación

- [x] Validaciones en DTOs (backend)
- [x] Validaciones activadas en controlador
- [x] Especificación de formulario documentada
- [x] Ejemplos de requests/responses
- [x] Código de validación frontend (Angular, React, TypeScript)
- [x] Sin errores de compilación
- [x] Mensajes de error en español

---

## Próximos Pasos (Opcional)

1. **Exception Handler Global**: Centralizar respuestas de error
2. **Validaciones Personalizadas**: Ej. `@ValidInvoiceDate` (dueDate >= invoiceDate)
3. **Trazabilidad**: Agregar logging en validaciones
4. **Tests Unitarios**: Test de validaciones en InvoiceService
5. **Frontend Real**: Implementar formulario en Angular/React

---

**Versión:** 1.0  
**Fecha:** 2026-05-08  
**Autor:** Implementación asistida por GitHub Copilot

