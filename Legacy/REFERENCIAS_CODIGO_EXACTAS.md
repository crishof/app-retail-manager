# REFERENCIAS DE CÓDIGO EXACTAS - RetailManager

## ÍNDICE RÁPIDO DE UBICACIONES

### Backend - Entidades Principales

| Entidad | Archivo | Líneas | Observaciones |
|---------|---------|--------|---|
| **Product** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/catalog/product/model/Product.java` | 1-110 | Stock en entidad separada |
| **Stock** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/inventory/model/Stock.java` | 1-49 | Cantidad actual por ubicación |
| **StockMovement** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/inventory/model/StockMovement.java` | 1-39 | Auditoría de cambios |
| **CashSession** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/CashSession.java` | 1-42 | Sesión de caja |
| **CashMovement** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/CashMovement.java` | 1-35 | Movimiento individual |
| **Invoice** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/Invoice.java` | 1-114 | ✅ CON taxRegime, finalizationStatus |
| **Sale** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/sales/model/Sale.java` | 1-67 | ❌ SIN taxRegime, finalizationStatus, currency |
| **Customer** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/party/customer/model/Customer.java` | 1-46 | ⚠️ SIN tipo cliente, régimen fiscal, crédito |

### Backend - Enums

| Enum | Archivo | Líneas | Valores |
|------|---------|--------|--------|
| **MovementType** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/MovementType.java` | 3-11 | INCOME, EXPENSE, SALE, CUSTOMER_PAYMENT, SUPPLIER_PAYMENT, OPENING, CLOSING |
| **SessionStatus** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/cash/model/SessionStatus.java` | 3-6 | OPEN, CLOSED |
| **StockMovementReason** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/operation/invoice/model/StockMovementReason.java` | 3-7 | INVOICE, ORDER, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT |
| **TaxRegime** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/TaxRegime.java` | 1-113 | Régimen fiscal (⚠️ SIN en Sale) |
| **DocumentFinalizationStatus** | `/backend/erphub-api/microservices/retail-api/src/main/java/com/zaphirio/retailapi/shared/fiscal/DocumentFinalizationStatus.java` | 1-92 | DRAFT, PENDING_APPROVAL, APPROVED, FINALIZED, CANCELED (⚠️ SIN en Sale) |

---

## ANÁLISIS DETALLADO DE CAMPOS

### 1. PRODUCT.JAVA - Líneas Exactas

```java
Línea 27-28:   private UUID id;                                    // @Id, @GeneratedValue
Línea 30-31:   private String code;                                // Código del producto
Línea 33-34:   private UUID brandId;                               // FK a Brand
Línea 36-37:   String brandName;                                   // Nombre de marca
Línea 39-40:   private String model;                               // Modelo/nombre
Línea 42-43:   private String description;                         // Descripción completa
Línea 45:      private UUID categoryId;                            // FK a Category
Línea 47:      private UUID dimensionId;                           // FK a Dimension
Línea 49:      private UUID supplierId;                            // FK a Supplier
Línea 51:      private UUID supplierProductId;                     // ID del producto en supplier
Línea 53-54:   private boolean active = true;                      // Estado activo
Línea 56-57:   private boolean published = false;                  // Publicado en ecommerce
Línea 59-60:   private boolean highlighted = false;                // Destacado/featured
Línea 62-68:   @ElementCollection List<String> imageUrls;          // URLs de imágenes
Línea 70:      private UUID priceId;                               // FK a Price
Línea 72-73:   private Instant createdAt;                          // Timestamp creación
Línea 75:      private Instant updatedAt;                          // Timestamp actualización

Códigos Comerciales:
Línea 79-80:   private String sku;                                 // @Column(unique=true)
Línea 82-83:   private String gtin;                                // Global Trade Item Number (14 chars)
Línea 85-86:   private String ean;                                 // European Article Number (13 chars)
Línea 88-89:   private String upc;                                 // USA code (12 chars)
Línea 91-92:   private String isbn;                                // Books (13 chars)
Línea 94-95:   private String mpn;                                 // Manufacturer Part Number (20 chars)

Línea 97-98:   private Long tenantId;                              // @Column(nullable=true)
```

---

### 2. STOCK.JAVA - Líneas Exactas

```java
Línea 10-11:   @UniqueConstraint(columnNames = {"product_id", "branch_id", "location_id"})
Línea 12-14:   @Index(name = "idx_stock_product", columnList = "productId")
Línea 14:      @Index(name = "idx_stock_branch", columnList = "branchId")
Línea 15:      @Index(name = "idx_stock_location", columnList = "locationId")

Línea 24-25:   private UUID id;                                    // @Id, @GeneratedValue
Línea 27-28:   private UUID productId;                             // Producto
Línea 30-31:   private UUID branchId;                              // Sucursal
Línea 33-34:   private UUID locationId;                            // Ubicación dentro de sucursal
Línea 36-37:   private int quantity;                               // Cantidad disponible
Línea 39-40:   private Instant updatedAt;                          // Última actualización
Línea 42-43:   private Long tenantId;                              // @Column(nullable=true)

Línea 45-48:   public void applyMovement(int delta) {              // Método para actualizar
                   this.quantity += delta;
                   this.updatedAt = Instant.now();
               }
```

---

### 3. STOCKMOVEMENT.JAVA - Líneas Exactas

```java
Línea 10-14:   @Table(name = "tbl_stock_movements", indexes = {
                   @Index(name = "idx_movement_product", columnList = "productId"),
                   @Index(name = "idx_movement_stock", columnList = "stockId"),
                   @Index(name = "idx_movement_reference", columnList = "referenceId")
               })

Línea 23-24:   private UUID id;                                    // @Id, @GeneratedValue
Línea 26:      private UUID stockId;                               // FK a Stock
Línea 27:      private UUID productId;                             // FK a Product
Línea 28:      private UUID branchId;                              // Sucursal
Línea 29:      private UUID locationId;                            // Ubicación
Línea 31:      private int quantity;                               // Cantidad +/-
Línea 33-34:   private StockMovementReason reason;                 // @Enumerated(EnumType.STRING)
Línea 36:      private UUID referenceId;                           // ID de referencia (invoice/order/transfer)
Línea 38:      private Instant createdAt;                          // Timestamp del movimiento
```

---

### 4. CASHSESSION.JAVA - Líneas Exactas

```java
Línea 19-20:   private UUID id;                                    // @Id, @GeneratedValue
Línea 22:      private UUID branchId;                              // Sucursal
Línea 23:      private UUID userId;                                // Usuario que abrió
Línea 25:      private LocalDate sessionDate;                      // Fecha de la sesión
Línea 26:      private LocalDateTime openedAt;                     // Hora de apertura
Línea 27:      private LocalDateTime closedAt;                     // Hora de cierre
Línea 29:      private double openingBalance;                      // Saldo inicial
Línea 30:      private double closingBalance;                      // Saldo final
Línea 32-33:   private SessionStatus status;                       // @Enumerated(EnumType.STRING): OPEN/CLOSED
Línea 35-36:   private String countedTotalsByCurrencyJson;         // JSON con totales por moneda
Línea 38-39:   private String exchangeRatesToArsJson;              // JSON con tipos de cambio a ARS
Línea 41:      private String notes;                               // Notas del cierre
```

---

### 5. CASHMOVEMENT.JAVA - Líneas Exactas

```java
Línea 18-19:   private UUID id;                                    // @Id, @GeneratedValue
Línea 21:      private UUID sessionId;                             // FK a CashSession
Línea 22:      private UUID branchId;                              // Sucursal
Línea 24-25:   private MovementType type;                          // @Enumerated(EnumType.STRING)
Línea 27:      private String currency;                            // Moneda (ARS, USD, EUR, etc.)
Línea 28:      private double originalAmount;                      // Monto en moneda original
Línea 29:      private double exchangeRateToArs;                   // Tasa de cambio a ARS
Línea 31:      private double amount;                              // Monto en ARS
Línea 32:      private String description;                         // Descripción del movimiento
Línea 33:      private String reference;                           // ⚠️ String genérico (debería ser UUID)
Línea 34:      private LocalDateTime createdAt;                    // Timestamp
```

---

### 6. INVOICE.JAVA - Líneas CRÍTICAS

```java
Línea 86-89:   @Enumerated(EnumType.STRING)
               @Column(name = "tax_regime", nullable = false)
               @ImmutableField(editableBeforeFinalization = true)
               private TaxRegime taxRegime;                        // ✅ PRESENTE

Línea 95-97:   @Enumerated(EnumType.STRING)
               @Column(name = "finalization_status", nullable = false)
               private DocumentFinalizationStatus finalizationStatus = DocumentFinalizationStatus.DRAFT;
                                                                   // ✅ PRESENTE

Línea 103-105: @Column(name = "finalized_at")
               @ImmutableField(editableBeforeFinalization = false)
               private Instant finalizedAt;                        // ✅ Timestamp de finalización

Línea 110-112: @Column(name = "finalized_by_user_id")
               @ImmutableField(editableBeforeFinalization = false)
               private UUID finalizedByUserId;                     // ✅ Auditoría: quién finalizó
```

---

### 7. SALE.JAVA - Líneas CRÍTICAS (PROBLEMAS)

```java
Línea 1-17:    package + imports                                  // SIN TaxRegime import
Línea 18-67:   public class Sale {                                 // 67 líneas TOTALES

Línea 20-22:   @Id
               @GeneratedValue(strategy = GenerationType.UUID)
               private UUID id;

Línea 24:      private UUID customerId;                            // FK a Customer
Línea 26-27:   private UUID branchId;
               private UUID locationId;

Línea 29:      private LocalDate saleDate;
Línea 31-32:   private String saleType;
               private String saleNumber;

Línea 34-36:   @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
               @Builder.Default
               private List<SaleItem> items = new ArrayList<>();

Línea 38-61:   Totales y campos impositivos                        // MISMOS QUE INVOICE
               (netValue0, netValue105, netValue21, netValue27, vat105, vat21, vat27, internalTax)
               (withholdingVat, withholdingSuss, etc.)

Línea 64-65:   @Column(name = "tenant_id", nullable = true)
               private Long tenantId;

❌ FALTA: TaxRegime taxRegime;                                     // NO EXISTE
❌ FALTA: DocumentFinalizationStatus finalizationStatus;          // NO EXISTE
❌ FALTA: String currency;                                         // NO EXISTE
❌ FALTA: Instant finalizedAt;                                    // NO EXISTE
❌ FALTA: UUID finalizedByUserId;                                 // NO EXISTE
```

---

### 8. CUSTOMER.JAVA - Líneas CRÍTICAS

```java
Línea 22:      private UUID id;                                    // @Id, @GeneratedValue
Línea 23-24:   private String name;                                // @Column(nullable=false, length=100)
Línea 25-26:   private String lastname;                            // @Column(nullable=false, length=100)
Línea 27-28:   private String dni;                                 // @Column(unique=true, length=20)
Línea 29-30:   private String taxId;                               // CUIT/NIF (length=20)
Línea 31-32:   private String email;                               // @Column(length=150)
Línea 33-34:   private String phone;                               // @Column(length=30)
Línea 36:      private UUID addressId;                             // FK a Address
Línea 38-39:   private Long tenantId;                              // Multi-tenancy
Línea 41-42:   private boolean deleted;                            // Soft delete
Línea 44-45:   private Instant deletedAt;                          // Soft delete timestamp

❌ FALTA: CustomerType customerType;                               // MAYORISTA/MINORISTA
❌ FALTA: TaxRegime taxRegime;                                     // NO EXISTE
❌ FALTA: double creditLimit;                                      // Límite de crédito
❌ FALTA: double currentBalance;                                   // Saldo actual
```

---

## FRONTEND - RUTAS Y COMPONENTES

### 1. E-commerce Routing

**Archivo**: `/frontend/ecommerce/src/app/app.routes.ts` (64 líneas)

```typescript
Línea 3:       export const routes: Routes = [
Línea 4-7:     { path: '', loadComponent: () => HomeComponent },
Línea 8-9:     { path: 'catalogo', loadComponent: () => CatalogComponent },
Línea 10-11:   { path: 'catalogo/:category', loadComponent: () => CatalogComponent },
Línea 12-13:   { path: 'producto/:slug', loadComponent: () => ProductDetailComponent },
Línea 14-15:   { path: 'carrito', loadComponent: () => CartComponent },
Línea 16-17:   { path: 'checkout', loadComponent: () => CheckoutComponent },
Línea 18-19:   { path: 'marcas', loadComponent: () => BrandsComponent },
Línea 20-21:   { path: 'noticias', loadComponent: () => NewsComponent },
Línea 22-23:   { path: 'favoritos', loadComponent: () => FavoritesComponent },
Línea 24-25:   { path: 'cuenta', loadComponent: () => AccountComponent },
Línea 26-27:   { path: 'pedidos', redirectTo: 'cuenta', pathMatch: 'full' },
Línea 28-29:   { path: '**', redirectTo: '', pathMatch: 'full' }
Línea 30:      ];

❌ NO HAY: { path: 'login', ... }
❌ NO HAY: canActivate: [authGuard]
```

---

### 2. Admin (Web-client) Routing

**Archivo**: `/frontend/web-client/src/app/app.routes.ts` (139 líneas)

#### Auth Routes:
```typescript
Línea 30-32:   {
                 path: 'landing',
                 loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
               }
Línea 56:      { path: '', redirectTo: 'landing/login', pathMatch: 'full' },
```

#### Dashboard:
```typescript
Línea 35:      { path: 'dashboard', component: DashboardHomeComponent, canActivate: [authGuard] },
Línea 37-41:   { path: 'dashboard/profile', loadComponent: () => ProfileComponent, canActivate: [authGuard] },
Línea 42-47:   { path: 'dashboard/settings', loadComponent: () => SettingsComponent, canActivate: [authGuard] },
Línea 48-53:   { path: 'dashboard/analytics', loadChildren: () => import('./features/analytics/analytics.routes').then(...), canActivate: [authGuard] },
```

#### Catalog:
```typescript
Línea 59:      { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
Línea 60:      { path: 'products/:id', component: ProductDetailsComponent, canActivate: [authGuard] },
Línea 61:      { path: 'products/:id/edit', component: ProductEditComponent, canActivate: [authGuard] },
Línea 62:      { path: 'brand', component: BrandComponent, canActivate: [authGuard] },
Línea 63:      { path: 'brand/create', component: BrandCreateComponent, canActivate: [authGuard] },
Línea 64:      { path: 'brand/:id', component: BrandDetailsComponent, canActivate: [authGuard] },
Línea 65:      { path: 'brand/:id/edit', component: BrandEditComponent, canActivate: [authGuard] },
Línea 66:      { path: 'category', component: CategoryComponent, canActivate: [authGuard] },
Línea 67:      { path: 'category/:id', component: CategoryDetailsComponent, canActivate: [authGuard] },
```

#### Sales/Comprobantes:
```typescript
Línea 70:      { path: 'customerInvoice', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'FACTURA_B' } },
Línea 71-72:   { path: 'comprobantes/nota-credito', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'NC_B' } },
Línea 73:      { path: 'comprobantes/nota-debito', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'ND_B' } },
Línea 74:      { path: 'comprobantes/presupuesto', component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'PRESUPUESTO' } },
Línea 75:      { path: 'comprobantes/ver', component: CustomerVoucherListComponent, canActivate: [authGuard] },
Línea 76-77:   { path: 'comprobantes/recibos', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Recibos' } }, ❌ INCOMPLETO
Línea 77:      { path: 'comprobantes/pagos', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Pagos' } }, ❌ INCOMPLETO
```

#### Inventory:
```typescript
Línea 94:      { path: 'almacen/remito', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Remito' } }, ❌ INCOMPLETO
Línea 95:      { path: 'almacen/inventario', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Inventario' } }, ❌ INCOMPLETO
```

#### Cash:
```typescript
Línea 98:      { path: 'caja', component: CashComponent, canActivate: [authGuard] },
```

#### Customers:
```typescript
Línea 91:      { path: 'clientes', component: CustomerComponent, canActivate: [authGuard] },
```

---

### 3. Navbar Component (E-commerce)

**Archivo**: `/frontend/ecommerce/src/app/shared/components/navbar/navbar.component.ts` (315 líneas)

```typescript
Línea 1-8:     imports + declarations
Línea 10-13:   @Component({ selector, standalone, changeDetection })
Línea 15-118:  template: `...`
Línea 19-26:   Logo section
Línea 28-64:   Search container
Línea 66-115:  Nav actions (Soporte, Cuenta, Favoritos, Carrito)

Línea 120-292: styles: [`...`]
Línea 122:     :host { display: block; position: sticky; top: 0; z-index: 200; }
Línea 123-127: .navbar { background: var(--surface); border-bottom: 1px solid var(--gray-200); }
Línea 128-137: .navbar-inner { grid-template-columns: 210px 1fr auto; height: 64px; }

Responsive breakpoints:
Línea 279:     @media (max-width: 1100px) { ... }
Línea 285:     @media (max-width: 768px) { ... }
Línea 289:     @media (max-width: 480px) { ... }

Línea 294-315: Component class
Línea 295-299: Service injections (CartService, FavoritesService, TenantService, ProductService, Router)
Línea 301-303: readonly signals: cartCount, cartTotal, tenant
Línea 305-314: Methods: onSearchInput(), onSearchEnter()
```

---

### 4. Product Card Component (E-commerce)

**Archivo**: `/frontend/ecommerce/src/app/shared/components/product-card/product-card.component.ts` (310 líneas)

```typescript
Línea 1-8:     imports + declarations
Línea 10-14:   @Component({ selector, standalone, changeDetection })
Línea 15-104:  template: `...`
Línea 16-104:  <article class="pcard"> ... </article>

Línea 106-267: styles: [`...`]
Línea 107-125: .pcard styling (border, border-radius, transitions)
Línea 128-136: .pcard-img (position: relative, aspect-ratio: 4/3)
Línea 147-155: .pcard-badges (position: absolute, top: 8px, left: 8px)
Línea 158-177: .fav-btn (position: absolute, top: 8px, right: 8px)
Línea 180-204: .pcard-body (padding, flex layout)
Línea 213-229: .pcard-price (price-now, price-old, price-save)
Línea 232-244: .pcard-meta (stock status, delivery info)
Línea 247-266: .add-btn (full width, primary color)

Línea 269-310: Component class
Línea 270:     readonly product = input.required<Product>();
Línea 272-276: Service injections
Línea 278-310: Methods: isFav(), stars, stockClass, stockLabel, addToCart(), toggleFav(), goToProduct()
```

---

### 5. Sidebar Component (Admin)

**Archivo**: `/frontend/web-client/src/app/shared/components/sidebar/sidebar.component.ts` (159 líneas)

```typescript
Línea 1-11:    imports + interface NavItem
Línea 13-79:   @Component({ selector, standalone, imports, template })
Línea 17-76:   <aside class="w-64 bg-gray-900 text-white ...">
Línea 19-70:   <nav> with @for loops for navItems
Línea 21-30:   Single link items (routerLink, routerLinkActive)
Línea 31-67:   Collapsible sections with toggleSection()
Línea 73-75:   Footer with copyright

Línea 80-159:  Component class
Línea 81-85:   expandedSections: Object
Línea 87-157:  navItems array with full navigation structure:
               - Dashboard
               - Catalog (Products, Brands, Categories)
               - Sales (Invoices, View, Quotes, Credit Notes)
               - Inventory (Stock, Remitos)
               - Suppliers
               - Customers
               - Cash
               - Analytics
               - Admin (Users, Companies, Branches)
```

---

### 6. Header Component (Admin)

**Archivo**: `/frontend/web-client/src/app/shared/components/header/header.component.ts` (165 líneas)

**❌ PROBLEMA LÍNEA 39 y 44**:

```typescript
Línea 35:      @if (store.currentUser()) {
Línea 39:      {{ (store.currentUser()?.firstName || 'U').charAt(0).toUpperCase() }}
Línea 44:      {{ store.currentUser()?.firstName || 'User' }}

❌ Backend envía "fullName", NO "firstName"
❌ Referencia: /backend/.../auth/model/User.java (línea 11)
```

---

## ESTILOS CSS

### 1. E-commerce Global Styles

**Archivo**: `/frontend/ecommerce/src/styles.css` (427 líneas)

```css
Línea 1-8:     @import fonts + * reset
Línea 19-94:   :root { Design tokens }
               - Paleta principal: #1a6b3a (verde)
               - Grises: 9 escalas (50-900)
               - Semánticos: red, green, orange, blue
               - Tipografía: Inter + Source Sans 3
               - Espacios: xs-2xl + gutter (20px)
               - Radios: sm-2xl (2-8px)
               - Sombras: xs, sm, md
               - Transiciones: fast (120ms), med (200ms)
               - Layout: max-width 1520px

Línea 100-427: HTML base + components (varios archivos importados)
```

### 2. Admin Global Styles

**Archivo**: `/frontend/web-client/src/styles.css` (109 líneas)

```css
Línea 1-3:     @tailwind base/components/utilities
Línea 5-22:    :root { Variables CSS }
               - Dimensiones: sidebar (256px), topbar (56px)
               - Colores primarios: #0d9488 (teal) ❌ DIFERENTE A ECOMMERCE
               - Colores: primary, accent, background, surface, border, text
               - Tipografía: Roboto (línea 28) ❌ DIFERENTE A ECOMMERCE

Línea 25-32:   HTML/Body base
Línea 34-39:   Angular Material overrides
Línea 41-45:   Scrollbar styling
Línea 47-107:  Bootstrap compatibility helpers
               - .table, .btn, .form-control, .row, .col, etc.
```

---

## RESUMEN CRÍTICO DE PROBLEMAS

### ❌ BACKEND - FALTANTES

| Campo | Entidad | Debería Estar | Referencia |
|-------|---------|-------------|-----------|
| **TaxRegime** | Sale | Sí (Invoice la tiene) | Line 86-89 en Invoice.java |
| **DocumentFinalizationStatus** | Sale | Sí (Invoice la tiene) | Line 95-97 en Invoice.java |
| **currency** | Sale | Sí (Invoice la tiene) | Line 77 en Invoice.java |
| **finalizedAt** | Sale | Sí (Invoice la tiene) | Line 103-105 en Invoice.java |
| **finalizedByUserId** | Sale | Sí (Invoice la tiene) | Line 110-112 en Invoice.java |
| **customerType** | Customer | Sí (Mayorista/Minorista) | Line 24-34 en Customer.java |
| **taxRegime** | Customer | Sí (para coherencia) | Line 29-30 en Customer.java |
| **creditLimit** | Customer | Sí (para B2B) | Line 33-34 en Customer.java |
| **DeliveryNote** | - | Sí (Remito/Albarani) | app.routes.ts línea 94 ❌ EnConstruccionComponent |

### ❌ FRONTEND - INCOMPATIBILIDADES

| Problema | E-commerce | Admin | Afecta |
|----------|-----------|-------|--------|
| **Color Primario** | #1a6b3a (verde) | #0d9488 (teal) | Consistencia de marca |
| **Tipografía Body** | Inter | Roboto | Consistencia visual |
| **Tipografía Display** | Source Sans 3 | (no especificada) | Jerarquía tipográfica |
| **Header Component** | Usa `fullName` ✅ | Usa `firstName` ❌ | Crash en renderizado |
| **Breakpoints** | 1100, 768, 480 | 1024 (Tailwind) | Responsive inconsistente |
| **Gutter** | 20px | px-4 (1rem) | Espaciado inconsistente |

---

**Documento generado**: 01 de Junio de 2026
