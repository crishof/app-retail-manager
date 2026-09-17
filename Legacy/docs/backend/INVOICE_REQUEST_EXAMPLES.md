# Ejemplos de Requests - Factura de Proveedor

## Curl - POST Factura Válida

```bash
curl -X POST http://localhost:9012/api/v1/purchases \
  -H "Content-Type: application/json" \
  -d '{
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
}'
```

---

## Curl - POST Factura Inválida (Campos Nulos)

```bash
curl -X POST http://localhost:9012/api/v1/purchases \
  -H "Content-Type: application/json" \
  -d '{
  "supplierId": null,
  "location": "",
  "saveStocks": null,
  "taxSave": null,
  "fixedAsset": null,
  "askForPriceUpdate": null,
  "invoiceItemsRequest": []
}'
```

**Respuesta esperada (400 Bad Request):**
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
      "field": "location",
      "message": "La ubicación no puede estar vacía"
    },
    {
      "field": "saveStocks",
      "message": "saveStocks no puede ser nulo"
    },
    {
      "field": "taxSave",
      "message": "taxSave no puede ser nulo"
    },
    {
      "field": "fixedAsset",
      "message": "fixedAsset no puede ser nulo"
    },
    {
      "field": "askForPriceUpdate",
      "message": "askForPriceUpdate no puede ser nulo"
    },
    {
      "field": "invoiceItemsRequest",
      "message": "Debe incluir al menos un artículo en la factura"
    }
  ]
}
```

---

## Postman - Collection JSON

```json
{
  "info": {
    "name": "Purchase API - Invoice",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Invoice - Valid",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"supplierId\": \"550e8400-e29b-41d4-a716-446655440000\",\n  \"location\": \"Almacén Principal\",\n  \"branchId\": \"550e8400-e29b-41d4-a716-446655441111\",\n  \"locationId\": \"550e8400-e29b-41d4-a716-446655442222\",\n  \"invoiceDate\": \"2026-05-08\",\n  \"dueDate\": \"2026-06-08\",\n  \"invoiceType\": \"NF\",\n  \"invoicePrefix\": \"001\",\n  \"invoiceNumber\": \"001234\",\n  \"invoiceItemsRequest\": [\n    {\n      \"id\": \"550e8400-e29b-41d4-a716-446655443333\",\n      \"quantity\": 10,\n      \"price\": 150.50,\n      \"taxRate\": 21.0,\n      \"discountRate\": 0.0\n    }\n  ],\n  \"saveStocks\": true,\n  \"taxSave\": true,\n  \"fixedAsset\": false,\n  \"askForPriceUpdate\": false,\n  \"subtotal1\": 1505.00,\n  \"discount\": 0.00,\n  \"interest\": 0.0,\n  \"subtotal2\": 1505.00,\n  \"netValue21\": 1505.00,\n  \"vat21\": 315.00,\n  \"netValue105\": 0.0,\n  \"vat105\": 0.0,\n  \"netValue27\": 0.0,\n  \"vat27\": 0.0,\n  \"netValue0\": 0.0,\n  \"internalTax\": 0.0,\n  \"withholdingVat\": 0.0,\n  \"withholdingSuss\": 0.0,\n  \"withholdingGrossReceiptsTax\": 0.0,\n  \"withholdingIncome\": 0.0,\n  \"stateTax\": 0.0,\n  \"localTax\": 0.0,\n  \"rounding\": 0.0,\n  \"totalPrice\": 1820.00\n}"
        },
        "url": {
          "raw": "http://localhost:9012/api/v1/purchases",
          "protocol": "http",
          "host": ["localhost"],
          "port": "9012",
          "path": ["api", "v1", "purchases"]
        }
      },
      "response": []
    },
    {
      "name": "Create Invoice - Missing Required Fields",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoiceItemsRequest\": []\n}"
        },
        "url": {
          "raw": "http://localhost:9012/api/v1/purchases",
          "protocol": "http",
          "host": ["localhost"],
          "port": "9012",
          "path": ["api", "v1", "purchases"]
        }
      },
      "response": []
    },
    {
      "name": "Get All Invoices",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:9012/api/v1/purchases",
          "protocol": "http",
          "host": ["localhost"],
          "port": "9012",
          "path": ["api", "v1", "purchases"]
        }
      },
      "response": []
    },
    {
      "name": "Get Invoice by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:9012/api/v1/purchases/550e8400-e29b-41d4-a716-446655440001",
          "protocol": "http",
          "host": ["localhost"],
          "port": "9012",
          "path": ["api", "v1", "purchases", "550e8400-e29b-41d4-a716-446655440001"]
        }
      },
      "response": []
    }
  ]
}
```

---

## JavaScript/Fetch - Petición Válida

```javascript
const invoice = {
  supplierId: "550e8400-e29b-41d4-a716-446655440000",
  location: "Almacén Principal",
  branchId: "550e8400-e29b-41d4-a716-446655441111",
  locationId: "550e8400-e29b-41d4-a716-446655442222",
  invoiceDate: "2026-05-08",
  dueDate: "2026-06-08",
  invoiceType: "NF",
  invoicePrefix: "001",
  invoiceNumber: "001234",
  invoiceItemsRequest: [
    {
      id: "550e8400-e29b-41d4-a716-446655443333",
      quantity: 10,
      price: 150.50,
      taxRate: 21.0,
      discountRate: 0.0
    }
  ],
  saveStocks: true,
  taxSave: true,
  fixedAsset: false,
  askForPriceUpdate: false,
  subtotal1: 1505.00,
  discount: 0.00,
  interest: 0.0,
  subtotal2: 1505.00,
  netValue21: 1505.00,
  vat21: 315.00,
  netValue105: 0.0,
  vat105: 0.0,
  netValue27: 0.0,
  vat27: 0.0,
  netValue0: 0.0,
  internalTax: 0.0,
  withholdingVat: 0.0,
  withholdingSuss: 0.0,
  withholdingGrossReceiptsTax: 0.0,
  withholdingIncome: 0.0,
  stateTax: 0.0,
  localTax: 0.0,
  rounding: 0.0,
  totalPrice: 1820.00
};

fetch('http://localhost:9012/api/v1/purchases', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(invoice)
})
  .then(response => {
    if (!response.ok) {
      return response.json().then(error => {
        console.error('Validation errors:', error);
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      });
    }
    return response.json();
  })
  .then(data => console.log('Invoice created:', data))
  .catch(error => console.error('Error:', error));
```

---

## Angular/TypeScript - Validación en Formulario

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InvoiceService } from './invoice.service';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  
  form: FormGroup;
  submitted = false;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {}

  private createForm(): FormGroup {
    return this.fb.group({
      supplierId: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3)]],
      branchId: ['', Validators.required],
      locationId: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      invoiceType: ['NF', Validators.required],
      invoicePrefix: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      invoiceNumber: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      invoiceItemsRequest: [[], [Validators.required, Validators.minLength(1)]],
      saveStocks: [false, Validators.required],
      taxSave: [false, Validators.required],
      fixedAsset: [false, Validators.required],
      askForPriceUpdate: [false, Validators.required],
      observations: [''],
      subtotal1: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      interest: [0, [Validators.required, Validators.min(0)]],
      subtotal2: [0, [Validators.required, Validators.min(0)]],
      netValue21: [0, [Validators.required, Validators.min(0)]],
      vat21: [0, [Validators.required, Validators.min(0)]],
      netValue105: [0, [Validators.required, Validators.min(0)]],
      vat105: [0, [Validators.required, Validators.min(0)]],
      netValue27: [0, [Validators.required, Validators.min(0)]],
      vat27: [0, [Validators.required, Validators.min(0)]],
      netValue0: [0, [Validators.required, Validators.min(0)]],
      internalTax: [0, [Validators.required, Validators.min(0)]],
      withholdingVat: [0, [Validators.required, Validators.min(0)]],
      withholdingSuss: [0, [Validators.required, Validators.min(0)]],
      withholdingGrossReceiptsTax: [0, [Validators.required, Validators.min(0)]],
      withholdingIncome: [0, [Validators.required, Validators.min(0)]],
      stateTax: [0, [Validators.required, Validators.min(0)]],
      localTax: [0, [Validators.required, Validators.min(0)]],
      rounding: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.form.invalid) {
      console.log('Form is invalid');
      return;
    }

    this.loading = true;
    this.error = null;

    this.invoiceService.createInvoice(this.form.value).subscribe({
      next: (response) => {
        console.log('Invoice created successfully:', response);
        this.form.reset();
        this.submitted = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error creating invoice';
        this.loading = false;
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    
    if (!field || !field.errors || !this.submitted) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName} es requerido`;
    }
    if (field.errors['min']) {
      return `${fieldName} debe ser >= ${field.errors['min'].min}`;
    }
    if (field.errors['minlength']) {
      return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['pattern']) {
      return `${fieldName} tiene formato inválido`;
    }

    return 'Campo inválido';
  }
}
```

---

## React/TypeScript - Hook de Validación

```typescript
import { useState } from 'react';

interface InvoiceItemRequest {
  id: string;
  quantity: number;
  price: number;
  taxRate: number;
  discountRate: number;
}

interface CreateInvoiceRequest {
  supplierId: string;
  location: string;
  branchId: string;
  locationId: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: string;
  invoicePrefix: string;
  invoiceNumber: string;
  invoiceItemsRequest: InvoiceItemRequest[];
  saveStocks: boolean;
  taxSave: boolean;
  fixedAsset: boolean;
  askForPriceUpdate: boolean;
  subtotal1: number;
  discount?: number;
  interest: number;
  subtotal2: number;
  netValue21: number;
  vat21: number;
  netValue105: number;
  vat105: number;
  netValue27: number;
  vat27: number;
  netValue0: number;
  internalTax: number;
  withholdingVat: number;
  withholdingSuss: number;
  withholdingGrossReceiptsTax: number;
  withholdingIncome: number;
  stateTax: number;
  localTax: number;
  rounding: number;
  totalPrice: number;
}

export const useInvoiceValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateInvoice = (invoice: CreateInvoiceRequest): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos requeridos
    if (!invoice.supplierId) {
      newErrors.supplierId = 'El ID del proveedor es requerido';
    }
    if (!invoice.location || invoice.location.trim() === '') {
      newErrors.location = 'La ubicación no puede estar vacía';
    }
    if (!invoice.branchId) {
      newErrors.branchId = 'El ID de la rama es requerido';
    }
    if (!invoice.locationId) {
      newErrors.locationId = 'El ID de la ubicación es requerido';
    }
    if (!invoice.invoiceDate) {
      newErrors.invoiceDate = 'La fecha de factura es requerida';
    }
    if (!invoice.dueDate) {
      newErrors.dueDate = 'La fecha de vencimiento es requerida';
    }
    if (!invoice.invoiceType) {
      newErrors.invoiceType = 'El tipo de factura es requerido';
    }
    if (!invoice.invoicePrefix) {
      newErrors.invoicePrefix = 'El prefijo de factura es requerido';
    }
    if (!invoice.invoiceNumber) {
      newErrors.invoiceNumber = 'El número de factura es requerido';
    }

    // Validar booleans
    if (invoice.saveStocks === null || invoice.saveStocks === undefined) {
      newErrors.saveStocks = 'saveStocks no puede ser nulo';
    }
    if (invoice.taxSave === null || invoice.taxSave === undefined) {
      newErrors.taxSave = 'taxSave no puede ser nulo';
    }
    if (invoice.fixedAsset === null || invoice.fixedAsset === undefined) {
      newErrors.fixedAsset = 'fixedAsset no puede ser nulo';
    }
    if (invoice.askForPriceUpdate === null || invoice.askForPriceUpdate === undefined) {
      newErrors.askForPriceUpdate = 'askForPriceUpdate no puede ser nulo';
    }

    // Validar items
    if (!invoice.invoiceItemsRequest || invoice.invoiceItemsRequest.length === 0) {
      newErrors.invoiceItemsRequest = 'Debe incluir al menos un artículo en la factura';
    }

    // Validar números positivos
    if (invoice.subtotal1 < 0) {
      newErrors.subtotal1 = 'El subtotal1 debe ser mayor o igual a 0';
    }
    if (invoice.totalPrice < 0) {
      newErrors.totalPrice = 'El precio total debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateInvoice };
};
```

---

**Nota:** Todos los ejemplos asumen que el puerto del servicio es `9012`. Ajustar según tu configuración.

