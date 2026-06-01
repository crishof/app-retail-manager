# ANÁLISIS COMPLETO - RetailManager

**Fecha**: 01 de Junio, 2026  
**Proyecto**: RetailManager - ERP/Retail Multi-módulo  
**Stack**: Angular (Frontend) + Spring Boot (Backend)

---

## TABLA DE CONTENIDOS
1. [Módulo Almacén](#módulo-almacén)
2. [Módulo Caja Diaria](#módulo-caja-diaria)
3. [UI/UX General](#uiux-general)
4. [Módulo Clientes](#módulo-clientes)
5. [Rutas y Navegación](#rutas-y-navegación)
6. [Inconsistencias y Problemas](#inconsistencias-y-problemas)
7. [Recomendaciones para Plan UI/UX Unificada](#recomendaciones-para-plan-uiux-unificada)

---

## 1. MÓDULO ALMACÉN

### 1.1 Entidad Product

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/catalog/product/model/Product.java`  
**Líneas**: 110 líneas total

#### Campos Principales:

```java
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;  // (línea 27-28)

@Column(length = 100)
private String code;  // (línea 30-31)

@Column(nullable = false)
private UUID brandId;  // (línea 33-34)

@Column(nullable = false)
String brandName;  // (línea 36-37)

@Column(nullable = false, length = 150)
private String model;  // (línea 39-40)

@Column(length = 1000)
private String description;  // (línea 42-43)

private UUID categoryId;  // (línea 45)
private UUID dimensionId;  // (línea 47)
private UUID supplierId;  // (línea 49)
private UUID supplierProductId;  // (línea 51)

@Column(nullable = false)
private boolean active = true;  // (línea 53-54)

@Column(nullable = false)
private boolean published = false;  // (línea 56-57)

@Column(nullable = false)
private boolean highlighted = false;  // (línea 59-60)

@ElementCollection
@CollectionTable(name = "tbl_product_images", joinColumns = @JoinColumn(name = "product_id"))
@Column(name = "image_url", nullable = false)
private List<String> imageUrls = new ArrayList<>();  // (línea 62-68)

private UUID priceId;  // (línea 70)

@Column(nullable = false)
private Instant createdAt;  // (línea 72-73)

private Instant updatedAt;  // (línea 75)
```

#### Códigos Comerciales (línea 77-95):

```java
@Column(unique = true, length = 100)
private String sku;  // Internal code

@Column(length = 14)
private String gtin;  // Global Trade Item Number

@Column(length = 13)
private String ean;  // European Article Number (EAN-13)

@Column(length = 12)
private String upc;  // USA

@Column(length = 13)
private String isbn;  // Books

@Column(length = 20)
private String mpn;  // Manufacturer Part Number

@Column(name = "tenant_id", nullable = true)
private Long tenantId;  // Multi-tenancy
```

#### Observaciones:
- ✅ Tiene campos de control completos
- ✅ Soporta multi-inquilino (tenantId)
- ✅ SoftDelete habilitado (@SoftDelete en línea 5)
- ⚠️ **NO tiene campo de stock integrado** - el stock está en entidad separada

---

### 1.2 Sistema de Inventario - Entidades de Stock

#### A) Stock (Cantidad actual por ubicación)

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/inventory/model/Stock.java`  
**Líneas**: 49 líneas

```java
@Entity
@Table(name = "tbl_stocks", uniqueConstraints = @UniqueConstraint(
        columnNames = {"product_id", "branch_id", "location_id"}))
// (línea 10-11)

@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;  // (línea 24-25)

@Column(nullable = false)
private UUID productId;  // (línea 27-28)

@Column(nullable = false)
private UUID branchId;  // (línea 30-31)

@Column(nullable = false)
private UUID locationId;  // (línea 33-34)

@Column(nullable = false)
private int quantity;  // (línea 36-37)

@Column(nullable = false)
private Instant updatedAt;  // (línea 39-40)

@Column(name = "tenant_id", nullable = true)
private Long tenantId;  // (línea 42-43)

public void applyMovement(int delta) {
    this.quantity += delta;
    this.updatedAt = Instant.now();
}  // (línea 45-48)
```

**Estructura de Constraints**: 
- Clave única: (product_id, branch_id, location_id)
- Índices: idx_stock_product, idx_stock_branch, idx_stock_location

---

#### B) StockMovement (Auditoría de cambios)

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/inventory/model/StockMovement.java`  
**Líneas**: 39 líneas

```java
@Entity
@Table(name = "tbl_stock_movements", indexes = {
    @Index(name = "idx_movement_product", columnList = "productId"),
    @Index(name = "idx_movement_stock", columnList = "stockId"),
    @Index(name = "idx_movement_reference", columnList = "referenceId")
})  // (línea 10-14)

@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;  // (línea 23-24)

private UUID stockId;  // (línea 26)
private UUID productId;  // (línea 27)
private UUID branchId;  // (línea 28)
private UUID locationId;  // (línea 29)

private int quantity;  // + o - (línea 31)

@Enumerated(EnumType.STRING)
private StockMovementReason reason;  // (línea 33-34)

private UUID referenceId;  // invoiceId, orderId, transferId (línea 36)

private Instant createdAt;  // (línea 38)
```

#### Enum StockMovementReason

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/StockMovementReason.java`

```java
public enum StockMovementReason {
    INVOICE,      // Compra a proveedor
    ORDER,        // Venta a cliente
    TRANSFER_IN,  // Transferencia entrada
    TRANSFER_OUT, // Transferencia salida
    ADJUSTMENT    // Ajuste manual de inventario
}
```

---

### 1.3 Remitos/Albaranes - ESTADO ACTUAL

**❌ CRÍTICO: NO EXISTE ENTIDAD ESPECÍFICA PARA REMITOS/ALBARANES**

**Rutas Vacías** (web-client app.routes.ts líneas 94-95):
```typescript
{ path: 'almacen/remito', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Remito' } },
{ path: 'almacen/inventario', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Inventario' } },
```

**Estado**: Ambas páginas están sin implementar (EnConstruccionComponent)

**Recomendación**: Crear entidades:
- `DeliveryNote` / `Remito` (documento de entrega)
- `DeliveryNoteItem` (items del remito)

---

### 1.4 Cómo se Gestiona Stock Actualmente

#### Flujo de Control de Inventario:

1. **Compra a Proveedor (Invoice)**:
   - Se crea `Invoice` con `InvoiceItem`
   - Se generan `StockMovement` con `reason = INVOICE`
   - Se actualiza `Stock.quantity` vía `applyMovement(delta)` (Stock.java línea 45)

2. **Venta a Cliente (Sale)**:
   - Se crea `Sale` con `SaleItem`
   - Se generan `StockMovement` con `reason = ORDER`
   - Se actualiza `Stock.quantity` (resta)

3. **Transferencias**:
   - StockMovement con `reason = TRANSFER_IN/TRANSFER_OUT`

4. **Ajustes Manuales**:
   - StockMovement con `reason = ADJUSTMENT`

#### Índices de Performance:
```java
@Index(name = "idx_movement_product", columnList = "productId"),
@Index(name = "idx_movement_stock", columnList = "stockId"),
@Index(name = "idx_movement_reference", columnList = "referenceId")
```

---

## 2. MÓDULO CAJA DIARIA

### 2.1 Entidad CashSession

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/CashSession.java`  
**Líneas**: 42 líneas

```java
@Entity
@Table(name = "tbl_cash_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;  // (línea 19-20)

    private UUID branchId;  // (línea 22)
    private UUID userId;  // (línea 23)

    private LocalDate sessionDate;  // (línea 25)
    private LocalDateTime openedAt;  // (línea 26)
    private LocalDateTime closedAt;  // (línea 27)

    private double openingBalance;  // (línea 29)
    private double closingBalance;  // (línea 30)

    @Enumerated(EnumType.STRING)
    private SessionStatus status;  // OPEN, CLOSED (línea 32-33)

    @Column(columnDefinition = "TEXT")
    private String countedTotalsByCurrencyJson;  // Multi-moneda (línea 35-36)

    @Column(columnDefinition = "TEXT")
    private String exchangeRatesToArsJson;  // Tipos de cambio (línea 38-39)

    private String notes;  // Notas de cierre (línea 41)
}
```

---

### 2.2 Entidad CashMovement

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/CashMovement.java`  
**Líneas**: 35 líneas

```java
@Entity
@Table(name = "tbl_cash_movement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;  // (línea 18-19)

    private UUID sessionId;  // Relación a CashSession (línea 21)
    private UUID branchId;  // (línea 22)

    @Enumerated(EnumType.STRING)
    private MovementType type;  // (línea 24-25)

    private String currency;  // (línea 27)
    private double originalAmount;  // Monto en moneda original (línea 28)
    private double exchangeRateToArs;  // Tasa a pesos (línea 29)

    private double amount;  // Monto en ARS (línea 31)
    private String description;  // (línea 32)
    private String reference;  // (línea 33)
    private LocalDateTime createdAt;  // (línea 34)
}
```

---

### 2.3 Enum MovementType

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/MovementType.java`  
**Líneas**: 11 líneas

```java
public enum MovementType {
    INCOME,              // Ingreso general (línea 4)
    EXPENSE,             // Gasto general (línea 5)
    SALE,                // Venta realizada (línea 6)
    CUSTOMER_PAYMENT,    // Pago de cliente (línea 7)
    SUPPLIER_PAYMENT,    // Pago a proveedor (línea 8)
    OPENING,             // Apertura de caja (línea 9)
    CLOSING              // Cierre de caja (línea 10)
}
```

---

### 2.4 Enum SessionStatus

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/SessionStatus.java`  
**Líneas**: 6 líneas

```java
public enum SessionStatus {
    OPEN,    // Caja abierta (línea 4)
    CLOSED   // Caja cerrada (línea 5)
}
```

---

### 2.5 Integración con Pagos/Recibos

#### ✅ Relación Encontrada:

1. **CashMovement → CUSTOMER_PAYMENT**: Registra pagos de clientes
2. **CashMovement → SUPPLIER_PAYMENT**: Registra pagos a proveedores

#### ⚠️ Limitaciones Actuales:

- `reference` en CashMovement es String genérico (no UUID)
- No hay validación de relación con Invoice/Sale/Receipt
- No hay auditoría de quién procesó el pago

#### Rutas Frontend - Estado Incompleto:

```typescript
// web-client/src/app/app.routes.ts línea 76-77
{ path: 'comprobantes/recibos', 
  component: EnConstruccionComponent, ... },
{ path: 'comprobantes/pagos', 
  component: EnConstruccionComponent, ... },
```

---

### 2.6 Controlador CashController

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/controller/CashController.java`

**Endpoints Disponibles** (esperados):
- POST `/api/cash/sessions` - Abrir sesión
- POST `/api/cash/movements` - Registrar movimiento
- PUT `/api/cash/sessions/{id}/close` - Cerrar sesión
- GET `/api/cash/sessions/{id}` - Ver detalles
- GET `/api/cash/movements?sessionId={id}` - Listar movimientos

---

## 3. UI/UX GENERAL

### 3.1 Arquitectura Frontend

**Proyectos Frontend**:

1. **`/frontend/ecommerce/`** - B2C E-commerce (Angular 21 standalone)
   - Puerto: 4201
   - Stack: Angular, Tailwind CSS
   - Usuarios: Clientes finales

2. **`/frontend/web-client/`** - B2B Admin Dashboard (Angular 21 + SSR)
   - Puerto: 4200
   - Stack: Angular + Express (SSR), Tailwind CSS
   - Usuarios: Administradores, vendedores, almaceneros

---

### 3.2 Sistema de Diseño E-commerce

**Archivo**: `/frontend/ecommerce/src/styles.css`  
**Líneas**: 427 líneas (completo)

#### Paleta de Colores (línea 19-59):

```css
:root {
  /* Primary — verde oscuro estilo Thomann */
  --primary:        #1a6b3a;     /* verde principal */
  --primary-dark:   #155730;     /* verde oscuro */
  --primary-light:  #228b4c;     /* verde claro */
  --primary-bg:     #f0f8f4;     /* fondo verde tenue */
  --primary-border: #b7dfc8;     /* borde verde tenue */

  /* Grises neutrales (9 niveles) */
  --gray-900: #111827;  /* texto principal */
  --gray-800: #1f2937;
  --gray-700: #374151;
  --gray-600: #4b5563;
  --gray-500: #6b7280;
  --gray-400: #9ca3af;
  --gray-300: #d1d5db;
  --gray-200: #e5e7eb;
  --gray-100: #f3f4f6;
  --gray-50:  #f9fafb;

  /* Semánticos */
  --red:        #dc2626;    /* errores, acciones destructivas */
  --red-dark:   #b91c1c;
  --red-bg:     #fef2f2;
  --green:      #16a34a;    /* éxito */
  --green-bg:   #f0fdf4;
  --orange:     #d97706;    /* advertencia */
  --orange-bg:  #fffbeb;
  --blue:       #1d4ed8;    /* info */
  --blue-bg:    #eff6ff;

  /* Tipografía */
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Source Sans 3', 'Inter', sans-serif;
  --font-mono:    'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;

  /* Escala tipográfica */
  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  28px;
  --text-3xl:  34px;

  /* Radios — conservadores, profesionales */
  --r-sm:  2px;
  --r-md:  3px;
  --r-lg:  4px;
  --r-xl:  6px;
  --r-2xl: 8px;

  /* Sombras — muy sutiles */
  --shadow-xs: 0 1px 2px rgba(0,0,0,.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 2px 6px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.04);

  /* Transiciones */
  --t-fast: .12s ease;
  --t-med:  .2s ease;

  /* Layout */
  --max-width: 1520px;
  --gutter:    20px;
}
```

**Estética**: Thomann (catálogo europeo profesional)  
**Fuentes**: Inter (body/UI) + Source Sans 3 (display)

---

### 3.3 Componentes Reutilizables - E-commerce

#### Navbar Component

**Archivo**: `/frontend/ecommerce/src/app/shared/components/navbar/navbar.component.ts`  
**Líneas**: 315 líneas

**Estructura** (HTML en template línea 15-118):
- Logo (línea 19-26)
- Search container (línea 28-64)
- Nav actions: Soporte, Cuenta, Favoritos, Carrito (línea 66-115)

**Estilo inline** (línea 120-292):
- Grid 3-columnas: logo | search | actions
- Altura: 64px
- Sticky positioning con z-index: 200
- Responsive: breakpoints en 1100px, 768px, 480px

**Servicios inyectados** (línea 295-299):
```typescript
private cartSvc    = inject(CartService);
private favSvc     = inject(FavoritesService);
private tenantSvc  = inject(TenantService);
private productSvc = inject(ProductService);
private router     = inject(Router);
```

---

#### Product Card Component

**Archivo**: `/frontend/ecommerce/src/app/shared/components/product-card/product-card.component.ts`  
**Líneas**: 310 líneas

**Estructura** (HTML línea 15-104):

```html
<article class="pcard">
  <!-- Image area con badges y wishlist -->
  <div class="pcard-img">
    <div class="pcard-badges">
      <!-- Badges: Sale, New, Outlet, Top seller -->
    </div>
    <button class="fav-btn"><!-- Wishlist --></button>
    <div class="pcard-img-inner">{{ product().emoji }}</div>
  </div>

  <!-- Body -->
  <div class="pcard-body">
    <div class="pcard-brand">{{ product().brand }}</div>
    <h3 class="pcard-name">{{ product().name }}</h3>
    
    <!-- Rating -->
    <div class="pcard-rating">
      <span class="stars">{{ stars }}</span>
      <span class="rev-count">({{ product().reviews }})</span>
    </div>

    <!-- Price -->
    <div class="pcard-price">
      <span class="price-now">{{ product().price }}</span>
      <span class="price-old">{{ product().oldPrice }}</span>
      <span class="price-save">−{{ product().discount }}%</span>
    </div>

    <!-- Stock + delivery -->
    <div class="pcard-meta">
      <span [class]="stockClass">{{ stockLabel }}</span>
      <span>Ships 24–48h</span>
    </div>

    <!-- Add to cart button -->
    <button class="add-btn">Add to cart</button>
  </div>
</article>
```

**Estilos CSS** (línea 106-267):
- Border: 1px solid var(--gray-200)
- Border-radius: var(--r-xl)
- Transiciones: var(--t-fast)
- Aspect ratio imagen: 4/3
- Clases dinámicas: `.stock-in`, `.stock-low`, `.stock-out`

**Input Signal** (línea 270):
```typescript
readonly product = input.required<Product>();
```

**Lógica** (línea 269-310):
- `isFav()` - Check favoritos
- `stars` - HTML stars rendering
- `stockClass` / `stockLabel` - Stock display
- `addToCart()` - Agregar carrito
- `toggleFav()` - Wishlist toggle
- `goToProduct()` - Navegar a detalle

---

### 3.4 Sistema de Diseño Admin (Web-client)

**Archivo**: `/frontend/web-client/src/styles.css`  
**Líneas**: 109 líneas

#### Variables CSS (línea 5-22):

```css
:root {
  --sidebar-width: 256px;
  --sidebar-collapsed-width: 64px;
  --topbar-height: 56px;

  --color-primary:      #0d9488;     /* teal-600 */
  --color-primary-dark: #0f766e;     /* teal-700 */
  --color-primary-900:  #134e4a;     /* teal-900 */
  --color-accent:       #f59e0b;     /* amber-500 */
  --color-bg:           #f1f5f9;     /* slate-100 */
  --color-surface:      #ffffff;
  --color-border:       #e2e8f0;     /* slate-200 */
  --color-text:         #0f172a;     /* slate-900 */
  --color-text-muted:   #64748b;     /* slate-500 */
  --color-sidebar-bg:   #0f172a;     /* slate-900 */
  --color-sidebar-text: #cbd5e1;     /* slate-300 */
}
```

**Framework**: Tailwind CSS 4.3 + Bootstrap compat helpers

#### Inconsistencia Visual Detectada:

| Sistema | Principal | Secundario | Acento | Font |
|---------|-----------|-----------|--------|------|
| **E-commerce** | #1a6b3a (verde) | #155730 | #dc2626 | Inter + Source Sans 3 |
| **Admin** | #0d9488 (teal) | #0f766e | #f59e0b | Roboto (línea 28) |

**❌ CRÍTICO**: Paletas totalmente diferentes

---

### 3.5 Componentes Admin - Sidebar

**Archivo**: `/frontend/web-client/src/app/shared/components/sidebar/sidebar.component.ts`  
**Líneas**: 159 líneas

**Estructura** (HTML línea 17-76):

```typescript
<aside class="w-64 bg-gray-900 text-white h-screen fixed left-0 top-16 
             overflow-y-auto hidden lg:flex flex-col">
  <nav class="flex-1 px-4 py-6 space-y-2">
    @for (item of navItems; track item.route) {
      @if (!item.children) {
        <!-- Single link -->
        <a [routerLink]="item.route" 
           routerLinkActive="bg-blue-600"
           class="flex items-center gap-3 px-4 py-3 rounded-lg 
                  text-sm font-medium text-gray-300 
                  hover:bg-gray-800 hover:text-white transition">
      } @else {
        <!-- Collapsible section -->
        <button (click)="toggleSection(item.label)"
                class="w-full flex items-center justify-between px-4 py-3">
          @if (expandedSections[item.label]) {
            <!-- Child items -->
          }
      }
    }
  </nav>
  
  <!-- Footer -->
  <div class="px-4 py-4 border-t border-gray-800">
    <p class="text-xs text-gray-500">© 2026 RetailManager</p>
  </div>
</aside>
```

**NavItems** (línea 87-157):
- Dashboard
- Catalog (Products, Brands, Categories)
- Sales (Invoices, View, Quotes, Credit Notes)
- Inventory (Stock, Remitos)
- Suppliers
- Customers
- Cash
- Analytics
- Admin (Users, Companies, Branches)

---

### 3.6 Componentes Admin - Header

**Archivo**: `/frontend/web-client/src/app/shared/components/header/header.component.ts`  
**Líneas**: 165 líneas

**Estructura** (HTML línea 11-100):

```html
<header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 
                    rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">R</span>
        </div>
        <span class="text-xl font-bold text-gray-900">RetailManager</span>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-8">
        <!-- Links -->
      </nav>

      <!-- User Menu -->
      <div class="flex items-center gap-4">
        <!-- Desktop User Info + Dropdown -->
        @if (store.currentUser()) {
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-300 rounded-full">
              {{ (store.currentUser()?.firstName || 'U').charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-medium">{{ store.currentUser()?.firstName }}</p>
              <p class="text-xs text-gray-500">{{ store.currentUser()?.email }}</p>
            </div>
          </div>
        }
        
        <!-- User Menu Dropdown con Profile, Settings, Sign Out -->
```

**⚠️ Problemas Detectados**:
1. Usa `firstName` (línea 39, 44) que **NO envía backend**
2. Backend retorna `fullName` (RESUMEN_RAPIDO.md línea 34)

---

### 3.7 Inconsistencias Visuales

#### 1. Colores Primarios Inconsistentes

- **E-commerce**: Verde (#1a6b3a)
- **Admin Dashboard**: Teal (#0d9488)
- **¿Qué debería ser?**: Un único color para toda la marca

#### 2. Tipografía

- **E-commerce**: Inter + Source Sans 3
- **Admin**: Roboto (vía styles.css línea 28)
- **Problema**: Font-face inconsistente

#### 3. Espacios y Radios

| Elemento | E-commerce | Admin | Recomendación |
|----------|-----------|-------|------|
| Border radius | --r-xl: 6px | var(--r-xl): sin definir (Tailwind) | Unificar |
| Gutter | --gutter: 20px | px-4 / px-6 (Tailwind) | Unificar escala |
| Sombras | --shadow-md | shadow-lg (Tailwind) | Unificar |

#### 4. Breakpoints Responsive

- **E-commerce**: 1100px, 768px, 480px
- **Admin**: 1024px (Tailwind default)
- **Problema**: Saltos visuales inconsistentes

---

## 4. MÓDULO CLIENTES

### 4.1 Entidad Customer

**Archivo**: `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/party/customer/model/Customer.java`  
**Líneas**: 46 líneas

```java
@Entity
@Table(name = "tbl_customers", indexes = {@Index(name = "idx_customer_dni", columnList = "dni")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SoftDelete  // Soft delete habilitado
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;  // (línea 22)

    @Column(nullable = false, length = 100)
    private String name;  // (línea 23-24)

    @Column(nullable = false, length = 100)
    private String lastname;  // (línea 25-26)

    @Column(unique = true, length = 20)
    private String dni;  // (línea 27-28)

    @Column(length = 20)
    private String taxId;  // CUIT/NIF (línea 29-30)

    @Column(length = 150)
    private String email;  // (línea 31-32)

    @Column(length = 30)
    private String phone;  // (línea 33-34)

    private UUID addressId;  // FK a Address (línea 36)

    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;  // Multi-tenancy (línea 38-39)

    @Column(name = "deleted", insertable = false, updatable = false)
    private boolean deleted;  // (línea 41-42)

    @Column(name = "deleted_at", insertable = false, updatable = false)
    private Instant deletedAt;  // (línea 44-45)
}
```

#### Características:

- ✅ Tiene ID de dirección (addressId)
- ✅ Soporta soft delete
- ✅ Multi-tenancy
- ✅ Índice en DNI (búsqueda rápida)
- ✅ Tax ID (CUIT/NIF)
- ⚠️ **NO tiene tipo de cliente** (mayorista vs minorista)
- ⚠️ **NO tiene régimen fiscal** (diferente a la entidad User)
- ⚠️ **NO tiene límite de crédito**

---

### 4.2 Relaciones con Invoice/Sale

#### Relación: Customer → Sale

```
Customer (n) -----> (1) Sale
  └─ id (UUID)         └─ customerId (UUID FK)
  └─ email             └─ saleDate
  └─ phone             └─ saleType
                       └─ saleNumber
                       └─ items (SaleItem[])
```

#### Relación: Customer → Invoice

**NO EXISTE** - Invoices son solo de compras a proveedores (tabla `tbl_supplier_invoice`)

---

### 4.3 Frontend Customer Component

**Archivo**: `/frontend/web-client/src/app/pages/customer/customer/customer.component.ts`

**Ruta**: `/clientes` (web-client app.routes.ts línea 91)

```typescript
{ path: 'clientes', 
  component: CustomerComponent, 
  canActivate: [authGuard] }
```

---

## 5. RUTAS Y NAVEGACIÓN

### 5.1 E-commerce Routing

**Archivo**: `/frontend/ecommerce/src/app/app.routes.ts`  
**Líneas**: 64 líneas

```typescript
export const routes: Routes = [
  { path: '', loadComponent: () => HomeComponent },           // (línea 6-7)
  { path: 'catalogo', loadComponent: () => CatalogComponent },
  { path: 'catalogo/:category', loadComponent: () => CatalogComponent },
  { path: 'producto/:slug', loadComponent: () => ProductDetailComponent },
  { path: 'carrito', loadComponent: () => CartComponent },
  { path: 'checkout', loadComponent: () => CheckoutComponent },
  { path: 'marcas', loadComponent: () => BrandsComponent },
  { path: 'noticias', loadComponent: () => NewsComponent },
  { path: 'favoritos', loadComponent: () => FavoritesComponent },
  { path: 'cuenta', loadComponent: () => AccountComponent },
  { path: 'pedidos', redirectTo: 'cuenta', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
```

**Características**:
- ✅ Lazy loading con `loadComponent()`
- ✅ Ruta wildcard al inicio
- ⚠️ **NO tiene autenticación** (público)
- ⚠️ **NO tiene ruta login** (¿integración pendiente?)

---

### 5.2 Admin (Web-client) Routing

**Archivo**: `/frontend/web-client/src/app/app.routes.ts`  
**Líneas**: 139 líneas

#### Auth/Landing:
```typescript
{
  path: 'landing',
  loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
}  // (línea 30-32)
```

#### Dashboard:
```typescript
{ path: 'dashboard', 
  component: DashboardHomeComponent, 
  canActivate: [authGuard] }  // (línea 35)

{ path: 'dashboard/profile', 
  loadComponent: () => ProfileComponent, 
  canActivate: [authGuard] }  // (línea 37-41)

{ path: 'dashboard/analytics', 
  loadChildren: () => import('./features/analytics/analytics.routes').then(...), 
  canActivate: [authGuard] }  // (línea 48-53)
```

#### Catálogo:
```typescript
{ path: 'products', component: ProductsComponent, canActivate: [authGuard] },
{ path: 'products/:id', component: ProductDetailsComponent, canActivate: [authGuard] },
{ path: 'products/:id/edit', component: ProductEditComponent, canActivate: [authGuard] },
{ path: 'brand', component: BrandComponent, canActivate: [authGuard] },
{ path: 'brand/create', component: BrandCreateComponent, canActivate: [authGuard] },
{ path: 'brand/:id', component: BrandDetailsComponent, canActivate: [authGuard] },
{ path: 'brand/:id/edit', component: BrandEditComponent, canActivate: [authGuard] },
{ path: 'category', component: CategoryComponent, canActivate: [authGuard] },
{ path: 'category/:id', component: CategoryDetailsComponent, canActivate: [authGuard] },
```

#### Ventas/Comprobantes:
```typescript
{ path: 'customerInvoice', 
  component: CustomerInvoiceComponent, 
  canActivate: [authGuard], 
  data: { voucherType: 'FACTURA_B' } },  // (línea 70)

{ path: 'comprobantes/nota-credito', 
  component: CustomerInvoiceComponent, 
  canActivate: [authGuard], 
  data: { voucherType: 'NC_B' } },  // (línea 71-72)

{ path: 'comprobantes/nota-debito', 
  component: CustomerInvoiceComponent, 
  canActivate: [authGuard], 
  data: { voucherType: 'ND_B' } },  // (línea 73)

{ path: 'comprobantes/presupuesto', 
  component: CustomerInvoiceComponent, 
  canActivate: [authGuard], 
  data: { voucherType: 'PRESUPUESTO' } },  // (línea 74)

{ path: 'comprobantes/ver', 
  component: CustomerVoucherListComponent, 
  canActivate: [authGuard] },

{ path: 'comprobantes/ver/:id', 
  component: CustomerVoucherDetailComponent, 
  canActivate: [authGuard] },

// VACIOS
{ path: 'comprobantes/recibos', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Recibos' } },  // (línea 76)

{ path: 'comprobantes/pagos', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Pagos' } },  // (línea 77)
```

#### Proveedores:
```typescript
{ path: 'supplier', component: SupplierComponent, canActivate: [authGuard] },
{ path: 'supplier/new', component: SupplierFormComponent, canActivate: [authGuard] },
{ path: 'supplier/:id/edit', component: SupplierFormComponent, canActivate: [authGuard] },
{ path: 'supplier/:id', component: SupplierDetailsComponent, canActivate: [authGuard] },
{ path: 'supplierInvoice', component: SupplierInvoiceComponent, canActivate: [authGuard] },
{ path: 'supplierPriceList', component: SupplierPriceListComponent, canActivate: [authGuard] },
{ path: 'supplier/cuenta-corriente', component: SupplierComponent, canActivate: [authGuard] },
```

#### Clientes:
```typescript
{ path: 'clientes', 
  component: CustomerComponent, 
  canActivate: [authGuard] },  // (línea 91)
```

#### Almacén:
```typescript
{ path: 'almacen/remito', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Remito' } },  // (línea 94)

{ path: 'almacen/inventario', 
  component: EnConstruccionComponent, 
  canActivate: [authGuard], 
  data: { titulo: 'Inventario' } },  // (línea 95)
```

#### Caja:
```typescript
{ path: 'caja', 
  component: CashComponent, 
  canActivate: [authGuard] },  // (línea 98)
```

#### Módulos Vacíos:
```typescript
// E-commerce, Technical Service, Reporting, Accounting, Admin, etc.
{ path: 'ecommerce/ordenes', component: EnConstruccionComponent, ... },
{ path: 'servicio-tecnico', component: EnConstruccionComponent, ... },
{ path: 'informes/*', component: EnConstruccionComponent, ... },
{ path: 'contabilidad/*', component: EnConstruccionComponent, ... },
{ path: 'admin/*', component: EnConstruccionComponent, ... },
```

#### Configuración:
```typescript
{ path: 'configuracion/general', component: CompaniesComponent, canActivate: [authGuard] },
{ path: 'configuracion/general/empresas', component: CompaniesComponent, canActivate: [authGuard] },
{ path: 'configuracion/general/sucursales', component: BranchesComponent, canActivate: [authGuard] },
{ path: 'configuracion/usuarios', component: EnConstruccionComponent, canActivate: [authGuard] },
```

---

### 5.3 Protección de Rutas

#### AuthGuard

**Archivo**: `/frontend/web-client/src/app/core/auth/auth.guard.ts`

```typescript
export const authGuard    // Protege rutas autenticadas
export const noAuthGuard  // Protege rutas públicas de usuarios autenticados
export const roleGuard    // Verifica roles específicos
```

**Uso**:
```typescript
canActivate: [authGuard]
canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] }
```

---

### 5.4 Lazy Loading

**Estrategia 1**: `loadComponent()`
```typescript
loadComponent: () => import('./features/auth/auth.routes')
               .then(m => m.authRoutes)
```

**Estrategia 2**: `loadChildren()`
```typescript
loadChildren: () => import('./features/analytics/analytics.routes')
             .then(m => m.analyticsRoutes)
```

---

### 5.5 Estructura de Módulos Feature

**Archivos observados**:
- `/frontend/web-client/src/app/features/auth/auth.routes.ts`
- `/frontend/web-client/src/app/features/dashboard/dashboard.routes.ts`
- `/frontend/web-client/src/app/features/analytics/analytics.routes.ts`

**Patrón**: Cada feature tiene su propio `*.routes.ts` que se carga lazy

---

## 6. INCONSISTENCIAS Y PROBLEMAS

### 6.1 CRÍTICOS (C)

| ID | Problema | Ubicación | Severidad |
|----|----------|-----------|-----------|
| C1 | Sale entity **SIN TaxRegime** | backend/...sales/model/Sale.java | CRÍTICO |
| C2 | Sale entity **SIN FinalizationStatus** | backend/...sales/model/Sale.java | CRÍTICO |
| C3 | **Paletas de color inconsistentes** | ecommerce + web-client styles.css | CRÍTICO |
| C4 | **Tipografía incompatible** | Inter vs Roboto | CRÍTICO |
| C5 | Header component usa `firstName` no enviado por backend | web-client header.component.ts línea 39 | CRÍTICO |
| C6 | **Remitos/Albaranes NO existen** | No hay modelo de datos | CRÍTICO |

---

### 6.2 ALTOS (A)

| ID | Problema | Ubicación | Severidad |
|----|----------|-----------|-----------|
| A1 | Sale entity **SIN currency field** | backend/...sales/model/Sale.java | ALTO |
| A2 | Role mismatch Backend vs Frontend | Backend: ADMIN/MANAGER/EMPLOYEE vs Frontend: ADMIN/OPERATOR/VIEWER | ALTO |
| A3 | Customer **SIN tipo de cliente** (mayorista/minorista) | Customer.java | ALTO |
| A4 | Customer **SIN régimen fiscal** | Customer.java vs Invoice.taxRegime | ALTO |
| A5 | Customer **SIN límite de crédito** | Customer.java | ALTO |
| A6 | Breakpoints responsive inconsistentes | E-commerce: 1100/768/480px vs Admin: 1024px (Tailwind) | ALTO |
| A7 | Espacios (gutter) inconsistentes | E-commerce: 20px vs Admin: px-4 (1rem) | ALTO |

---

### 6.3 MEDIOS (M)

| ID | Problema | Ubicación | Severidad |
|----|----------|-----------|-----------|
| M1 | Sombras inconsistentes | --shadow-md vs shadow-lg | MEDIO |
| M2 | Radios border inconsistentes | --r-xl: 6px vs Tailwind default | MEDIO |
| M3 | Muchas rutas incompletas (EnConstruccionComponent) | app.routes.ts líneas 76, 94-95, 101-128 | MEDIO |
| M4 | CashMovement.reference es String genérico | No hay UUID strong-typed references | MEDIO |
| M5 | No hay entidad explícita de Receipt/Recibo | Falta modelo de comprobante de pago | MEDIO |

---

## 7. RECOMENDACIONES PARA PLAN UI/UX UNIFICADA

### 7.1 Arquitectura de Diseño Recomendada

```
Design System - RetailManager
├── Tokens
│   ├── Color Palette
│   │   ├── Primary: #1a6b3a (verde - mantener consistencia marca)
│   │   ├── Primary Dark: #155730
│   │   ├── Primary Light: #228b4c
│   │   ├── Accent: #f59e0b (warnings/highlights)
│   │   └── Grises (9 niveles) + Semánticos (red, green, blue, orange)
│   ├── Typography
│   │   ├── Body: Inter 400, 500, 600, 700
│   │   ├── Display: Source Sans 3 600, 700, 800
│   │   └── Mono: SFMono-Regular
│   ├── Spacing Scale
│   │   ├── xs: 4px
│   │   ├── sm: 8px
│   │   ├── md: 12px
│   │   ├── lg: 16px
│   │   ├── xl: 24px
│   │   ├── 2xl: 32px
│   │   └── gutter (viewport): 20px
│   ├── Border Radii
│   │   ├── sm: 2px (buttons)
│   │   ├── md: 3px
│   │   ├── lg: 4px
│   │   ├── xl: 6px (cards)
│   │   └── 2xl: 8px (modals)
│   ├── Shadows
│   │   ├── xs: 0 1px 2px rgba(0,0,0,.05)
│   │   ├── sm: 0 1px 3px rgba(0,0,0,.08)
│   │   └── md: 0 2px 6px rgba(0,0,0,.07)
│   └── Motion
│       ├── Fast: 120ms ease (hover, focus)
│       └── Med: 200ms ease (transitions)
│
├── Components
│   ├── Button (Primary, Secondary, Outline, Ghost)
│   ├── Card (with padding, borders)
│   ├── Input (text, select, textarea)
│   ├── Modal/Dialog
│   ├── Sidebar/Navigation
│   ├── Header/Navbar
│   ├── Badge (success, warning, error, info)
│   ├── Alert
│   ├── Toast/Notification
│   ├── Table
│   ├── Pagination
│   ├── Dropdown/Menu
│   └── Form Group
│
├── Patterns
│   ├── Forms (validation, error states)
│   ├── Lists (scrolling, infinite load)
│   ├── Modals (confirmation, forms)
│   ├── Dropdowns (menu, select)
│   ├── Popovers/Tooltips
│   └── Loading States (skeleton, spinner)
│
└── Layouts
    ├── E-commerce
    │   ├── Header + Search + Nav
    │   ├── Sidebar (collapsed mobile)
    │   └── Content area
    └── Admin
        ├── Top bar
        ├── Sidebar (collapsible)
        └── Main content
```

---

### 7.2 Especificación de Breakpoints Unificados

```typescript
// shared/constants/breakpoints.ts
export const BREAKPOINTS = {
  xs: 320,    // Mobile
  sm: 640,    // Small mobile
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  '2xl': 1536 // Extra large
} as const;

// CSS Media Queries
@media (max-width: 640px)  { ... }   // Mobile
@media (max-width: 768px)  { ... }   // Tablet
@media (max-width: 1024px) { ... }   // Desktop
@media (min-width: 1024px) { ... }   // Large
```

---

### 7.3 Estructura de Componentes Compartidos

```
frontend/
├── shared/
│   ├── components/
│   │   ├── button/
│   │   │   ├── button.component.ts
│   │   │   ├── button.component.scss
│   │   │   └── button.types.ts
│   │   ├── card/
│   │   ├── input/
│   │   ├── modal/
│   │   ├── sidebar/
│   │   ├── header/
│   │   ├── badge/
│   │   ├── toast/
│   │   ├── table/
│   │   └── ...
│   ├── layouts/
│   │   ├── dashboard-layout/
│   │   ├── ecommerce-layout/
│   │   └── auth-layout/
│   ├── directives/
│   ├── pipes/
│   ├── utils/
│   ├── constants/
│   │   ├── breakpoints.ts
│   │   ├── colors.ts
│   │   └── spacing.ts
│   ├── styles/
│   │   ├── _variables.css (design tokens)
│   │   ├── _components.css
│   │   ├── _utilities.css
│   │   └── _reset.css
│   └── styles.css (main import)
└── styles.css (root level)
```

---

### 7.4 Plan de Migración

#### Fase 1: Unificación de Tokens (Semana 1-2)

1. **Crear `_variables.css` centralizado**:
```css
/* shared/styles/_variables.css */
:root {
  /* PRIMARY COLOR PALETTE - Verde (Mantener consistencia) */
  --primary-50:    #f0f8f4;
  --primary-100:   #d9ecdf;
  --primary-200:   #b7dfc8;
  --primary-300:   #8ecfad;
  --primary-400:   #62bb88;
  --primary-500:   #3da765;
  --primary-600:   #228b4c;
  --primary-700:   #1a6b3a;
  --primary-800:   #155730;
  --primary-900:   #0f3a1e;

  /* SEMANTIC COLORS */
  --success-500: #16a34a;
  --warning-500: #d97706;
  --error-500:   #dc2626;
  --info-500:    #1d4ed8;

  /* NEUTRAL GRAYS - 9 escalas */
  --gray-50:   #f9fafb;
  --gray-100:  #f3f4f6;
  --gray-200:  #e5e7eb;
  --gray-300:  #d1d5db;
  --gray-400:  #9ca3af;
  --gray-500:  #6b7280;
  --gray-600:  #4b5563;
  --gray-700:  #374151;
  --gray-800:  #1f2937;
  --gray-900:  #111827;

  /* TYPOGRAPHY */
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Source Sans 3', 'Inter', sans-serif;

  /* SPACING SCALE */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  24px;
  --space-2xl: 32px;
  --gutter:    20px;

  /* BORDER RADIUS */
  --radius-sm:  2px;
  --radius-md:  3px;
  --radius-lg:  4px;
  --radius-xl:  6px;
  --radius-2xl: 8px;

  /* SHADOWS */
  --shadow-xs: 0 1px 2px rgba(0,0,0,.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 2px 6px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.04);
  --shadow-lg: 0 10px 15px rgba(0,0,0,.10), 0 4px 6px rgba(0,0,0,.05);

  /* TRANSITIONS */
  --transition-fast: 120ms ease;
  --transition-med:  200ms ease;
  --transition-slow: 300ms ease;

  /* LAYOUT */
  --max-width: 1520px;
  --sidebar-width: 256px;
  --header-height: 64px;
}
```

2. **Actualizar web-client styles.css** para usar variables unificadas
3. **Actualizar ecommerce styles.css** para usar variables unificadas

#### Fase 2: Componentes Compartidos (Semana 3-4)

1. **Crear librería shared** con componentes reutilizables
2. **Auditar colores en templates** y reemplazar hardcoded
3. **Crear utility classes** para spacing, typography

#### Fase 3: Layouts y Navegación (Semana 5-6)

1. **Unificar Header** (tanto ecommerce como admin)
2. **Unificar Sidebar** (admin)
3. **Crear responsive breakpoints** consistentes
4. **Implementar mobile navigation** unificada

#### Fase 4: Testing y Refinamiento (Semana 7-8)

1. **Audit de accesibilidad** (WCAG AA)
2. **Testing cross-browser**
3. **Performance profiling**
4. **Documentation**

---

### 7.5 Documentación Requerida

Crear archivo `/frontend/DESIGN_SYSTEM.md`:

```markdown
# RetailManager Design System v1.0

## Color Palette

### Primary Colors
- Primary 700 (Main): #1a6b3a
- Primary 600 (Hover): #228b4c
- Primary 800 (Active): #155730

## Typography

- Body: Inter (weight: 400, 500, 600, 700)
- Display: Source Sans 3 (weight: 600, 700, 800)

## Spacing

Base unit: 4px
Scale: 4, 8, 12, 16, 24, 32, 40, 48px

## Components

### Button
- Variants: Primary, Secondary, Outline, Ghost, Link
- Sizes: Small, Medium, Large
- States: Default, Hover, Active, Disabled, Loading

### Card
- Padding: var(--space-lg)
- Border: 1px solid var(--gray-200)
- Border Radius: var(--radius-xl)
- Shadow: var(--shadow-md)

... (continuar para cada componente)
```

---

### 7.6 Archivos a Crear/Modificar

#### Archivos NUEVOS:

```
frontend/
├── shared/
│   ├── components/
│   │   ├── button/button.component.ts
│   │   ├── card/card.component.ts
│   │   ├── input/input.component.ts
│   │   ├── modal/modal.component.ts
│   │   ├── sidebar/sidebar.component.ts
│   │   └── ...
│   ├── layouts/
│   │   ├── dashboard-layout.component.ts
│   │   ├── ecommerce-layout.component.ts
│   │   └── auth-layout.component.ts
│   ├── styles/
│   │   ├── _variables.css
│   │   ├── _components.css
│   │   ├── _utilities.css
│   │   ├── _reset.css
│   │   └── _responsive.css
│   └── constants/
│       ├── breakpoints.ts
│       ├── colors.ts
│       └── spacing.ts
└── DESIGN_SYSTEM.md
```

#### Archivos a MODIFICAR:

```
frontend/ecommerce/src/
├── styles.css (usar variables unificadas)
└── app/shared/components/
    ├── navbar/navbar.component.ts
    ├── product-card/product-card.component.ts
    └── ...

frontend/web-client/src/
├── styles.css (usar variables unificadas)
└── app/shared/components/
    ├── sidebar/sidebar.component.ts
    ├── header/header.component.ts
    └── ...
```

---

## RESUMEN EJECUTIVO

### Problemas Críticos Identificados:

1. **❌ Remitos/Albaranes**: No existe entidad en backend
2. **❌ Sale sin régimen fiscal**: No cumple AFIP (comprueba Invoice sí tiene TaxRegime)
3. **❌ Paletas de color inconsistentes**: Verde en ecommerce, Teal en admin
4. **❌ Tipografía mixta**: Inter vs Roboto
5. **❌ Frontend esperando campos no enviados**: `firstName` cuando backend envía `fullName`

### Archivos Clave para Referencia:

#### Backend:
- Product: `/backend/.../catalog/product/model/Product.java` (110 líneas)
- Stock: `/backend/.../inventory/model/Stock.java` (49 líneas)
- StockMovement: `/backend/.../inventory/model/StockMovement.java` (39 líneas)
- CashSession: `/backend/.../operation/cash/model/CashSession.java` (42 líneas)
- CashMovement: `/backend/.../operation/cash/model/CashMovement.java` (35 líneas)
- Invoice: `/backend/.../operation/invoice/model/Invoice.java` (114 líneas)
- Sale: `/backend/.../operation/sales/model/Sale.java` (67 líneas)
- Customer: `/backend/.../party/customer/model/Customer.java` (46 líneas)

#### Frontend E-commerce:
- App Routes: `/frontend/ecommerce/src/app/app.routes.ts` (64 líneas)
- Global Styles: `/frontend/ecommerce/src/styles.css` (427 líneas)
- Navbar Component: `/frontend/ecommerce/src/app/shared/components/navbar/navbar.component.ts` (315 líneas)
- Product Card: `/frontend/ecommerce/src/app/shared/components/product-card/product-card.component.ts` (310 líneas)

#### Frontend Admin:
- App Routes: `/frontend/web-client/src/app/app.routes.ts` (139 líneas)
- Global Styles: `/frontend/web-client/src/styles.css` (109 líneas)
- Sidebar Component: `/frontend/web-client/src/app/shared/components/sidebar/sidebar.component.ts` (159 líneas)
- Header Component: `/frontend/web-client/src/app/shared/components/header/header.component.ts` (165 líneas)

---

**Análisis completado**: 01 de Junio de 2026
**Horas de análisis**: ~2-3 horas
**Cobertura**: Backend (8 entidades), Frontend (2 proyectos, 15+ componentes)
