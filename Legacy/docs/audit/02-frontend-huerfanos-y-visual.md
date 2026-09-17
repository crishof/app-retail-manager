# FASE 2 · Auditoría Frontend: huérfanos y consistencia visual

> Auditoría SOLO LECTURA verificada leyendo el código real (no se confía en `FRONTEND_*.md` previos).
> Fecha: 2026-07-16. Cada hallazgo cita `archivo:línea`. Cuando no fue determinable se indica "No determinado" y el motivo.

## Inventario de apps (verificado)

| App | Paquete | Rol | Angular | UI stack | Nº componentes | Nº servicios |
|-----|---------|-----|---------|----------|----------------|--------------|
| `frontend/web-client` | `retailmanager` | Backoffice ERP | 21.2 | Material (mínimo) + Bootstrap (declarado, **no cargado**) + Tailwind 3.4 + echarts + jQuery (declarado, **sin uso**) + SSR | ~78 `@Component` | 24 |
| `frontend/ecommerce` | `ecommerce` | Portal ecommerce | 21.2 | CSS puro + tokens propios, sin Material/Tailwind/Bootstrap | 16 `@Component` | 5 |
| `frontend/erp-structure` | (sin `package.json`) | Stub / plantilla | — | — | 0 archivos | 0 |

### `frontend/erp-structure` es un stub NO desplegable (confirmado)
- No tiene `package.json`, `angular.json` ni `tsconfig` (`ls frontend/erp-structure/` solo contiene `src/`).
- `find frontend/erp-structure -type f` devuelve **0 archivos**: son solo directorios vacíos (árbol `features/{compras,ventas,finanzas,almacen,configuracion,gestion}`, `shared/components/{data-table,kpi-card,status-badge,empty-state,...}`).
- **Conclusión:** es un esqueleto de carpetas (plantilla de arquitectura ERP en español) sin código. No es una app.

### `frontend/web-client/src/erp-structure-reference` también está VACÍO
- `find frontend/web-client/src/erp-structure-reference -type f | wc -l` → **0 archivos** (solo directorios).
- No está referenciado en `angular.json`, `tsconfig*.json` ni `src/main.ts` (grep sin resultados).
- **Conclusión:** carpeta muerta dentro del build de web-client. Espejo vacío del stub anterior. Candidata a borrado (no aporta ni rompe nada porque no contiene `.ts`).

---

## Backoffice (web-client)

### 1. Componentes huérfanos

Metodología: en Angular standalone un componente solo se usa si (a) su **clase** se importa en `imports:[]`/rutas de otro `.ts`, o (b) su **selector** aparece como etiqueta en un template. Se verificaron ambos con grep sobre `*.ts` y `*.html`.

#### Huérfanos SEGUROS (0 referencias por clase y 0 por selector)

| Componente | Archivo:línea | Motivo |
|-----------|---------------|--------|
| `SalesInvoiceFormComponent` | `app/features/invoices/pages/sales-invoice-form/sales-invoice-form.component.ts:285` | No está en `invoices.routes.ts` (solo list/detail; `new` redirige a `/customerInvoice`). Clase sin imports. |
| `PurchaseInvoiceFormComponent` | `app/features/invoices/pages/purchase-invoice-form/purchase-invoice-form.component.ts:306` | Ídem: `new` redirige a `/supplierInvoice`. Clase sin imports. |
| `SalesInvoiceAccessibleComponent` | `app/features/invoices/pages/sales-invoice-list/sales-invoice-accessible.component.ts:278` | Variante "accesible" nunca enrutada ni importada. |
| `InvoiceItemsComponent` (`app-invoice-items`) | `app/pages/supplier/supplier-invoice/invoice-items/invoice-items.component.ts:19` | `<app-invoice-items>` no aparece en ningún HTML; clase sin imports (ni siquiera en `supplier-invoice`). |
| `CustomerDetailsComponent` (`app-customer-details`) | `app/pages/customer/customer-details/customer-details.component.ts:10` | Sin ruta, sin uso en templates, sin import. |
| `DashboardComponent` (`app-dashboard`, `pages/dashboard`) | `app/pages/dashboard/dashboard.component.ts:11` | Solo aparece en un comentario de `auth.guard.ts:9`. El dashboard vivo es `features/dashboard/.../dashboard-home`. |
| `HomeComponent` (`app-home`, `pages/home`) | `app/pages/home/home.component.ts:11` | Sin ruta ni referencia. |
| `ProductSearchComponent` (utils) | `app/utils/product-search/product-search.component.ts:10` | Selector duplicado `app-product-search`; sin uso. |
| `ProductSearchComponent` (pages) | `app/pages/product/product-search/product-search.component.ts:11` | **Clase y selector duplicados** con la anterior; ninguna se usa. |

#### Huérfanos por cadena muerta (transitivamente inalcanzables)

La ruta `dashboardRoutes` de `app/features/dashboard/dashboard.routes.ts:6` **nunca se importa** (grep de `dashboardRoutes` solo la halla en su propia definición). `app.routes.ts` cablea el dashboard directamente con `DashboardHomeComponent` y `loadComponent`, sin usar `dashboardRoutes`. Todo lo que cuelga solo de esa ruta es huérfano:

| Componente | Archivo:línea | Motivo |
|-----------|---------------|--------|
| `DashboardLayoutComponent` | `app/shared/layouts/dashboard-layout/dashboard-layout.component.ts:35` | Solo referenciado por `dashboard.routes.ts:2,9` (ruta muerta). |
| `HeaderComponent` (`app-header`) | `app/shared/components/header/header.component.ts:128` | Solo importado por `DashboardLayoutComponent` (huérfano). El shell vivo usa `layout/topbar`. |
| `SidebarComponent` (`shared/components/sidebar`) | `app/shared/components/sidebar/sidebar.component.ts:80` | Solo importado por `DashboardLayoutComponent`. **Colisión de nombre** con el sidebar vivo `app/layout/sidebar/sidebar.component.ts` (ambos `class SidebarComponent`, selector `app-sidebar`). El vivo es el importado en `app.component.ts:3`. |

> **Nota de duplicidad de selectores:** existen dos `app-sidebar` y dos `app-product-search`. Compilan porque los huérfanos nunca se declaran en el mismo `imports:[]` que el vivo, pero es deuda peligrosa.

#### Confirmados EN USO (no huérfanos, para descartar falsos positivos)
- `EnConstruccionComponent` (`app/shared/en-construccion/en-construccion.component.ts`): usado en **25 rutas** de `app.routes.ts` (placeholder "en construcción").
- `ConfirmDialogComponent`: instanciado vía `MatDialog` en `app/services/modal-dialog.service.ts:14` (no por selector).
- `category-edit`, `brand-edit`, `product-navbar`, `product-list`, `supplier-navbar`, `supplier-account-statement`, `supplier-purchase-history`, `customer-sale-history`, `link-product-modal`, `price-alert-badge`, `price-history-modal`, `price-alerts-with-history`: todos usados como sub-componentes por selector en templates padre (verificado).

### 2. Servicios / directivas / pipes huérfanos

| Artefacto | Archivo:línea | Motivo |
|-----------|---------------|--------|
| `StockService` | `app/services/stock.service.ts:8` | Solo aparece en su propio archivo (0 inyecciones). |
| `TransactionService` | `app/services/transaction.service.ts:10` | Solo aparece en su propio archivo (0 inyecciones). |
| `DefaultImageDirective` (`[appDefaultImage]`) | `app/utils/default-image.directive.ts:7` | Ni `appDefaultImage` ni `DefaultImageDirective` aparecen en ningún `.html`/`.ts` fuera de su definición. |

- **Pipes:** no se hallaron pipes propios (`*.pipe.ts`) en web-client.
- Resto de 24 servicios: en uso (p. ej. `ProductService` referenciado por 11 archivos; los `*-data.service` de dashboard/analytics por sus páginas).

### 3. Rutas muertas y enlaces rotos
- **Ruta muerta:** `dashboardRoutes` (`dashboard.routes.ts`) definida pero nunca importada (ver arriba).
- **25 rutas placeholder** apuntan a `EnConstruccionComponent` (`app.routes.ts:76-152`): comprobantes/recibos, comprobantes/pagos, almacen/remito, almacen/inventario, ecommerce/*, servicio-tecnico/*, informes/*, contabilidad/*, configuracion/usuarios, configuracion/archivos, importaciones, admin/roles, admin/auditoria, ayuda, notificaciones. No son "rotas" pero sí pantallas sin implementación.
- **Redirecciones internas** correctas (`statementAccount → supplier/cuenta-corriente`, `invoices/sales/new → /customerInvoice`, etc.).
- **routerLink rotos:** No determinado exhaustivamente. Verificación puntual de los links del sidebar/topbar contra rutas existentes no arrojó rotos evidentes, pero no se auditó cada `routerLink` de las 42 plantillas uno a uno (fuera de alcance de tiempo; recomendable pase automatizado).

### 4. Consistencia visual (granular)

El backoffice mezcla **tres sistemas de estilo simultáneos**, lo que genera inconsistencia estructural:

- **Global hand-rolled** en `app/../src/styles.css` (111 líneas): reimplementa clases tipo Bootstrap a mano — `.btn`, `.btn-outline-primary/secondary/success/danger`, `.btn-sm`, `.form-control`, `.table/.table-striped/.table-hover`, `.badge` (`styles.css:50-100`). Usan `var(--color-primary)` = **teal `#0d9488`** (`styles.css:12`).
- **Bootstrap 5.3.8** está en `package.json` pero **NO se carga** (no aparece en `angular.json` `styles[]` ni en `styles.css`). Por tanto las clases `btn-primary`, `card`, `col-`, `row` usadas en ~29 plantillas dependen del CSS hand-rolled o quedan sin estilar. Dependencia muerta.
- **Tailwind 3.4**: usado para utilidades de layout (`flex`, `grid`, `p-`, `text-`) en ~22/42 plantillas, pero su **paleta de marca custom `primary` (azul #3b82f6) tiene 0 usos** (`(bg|text|border)-primary-[0-9]` → 0 archivos). Adopción superficial.
- **Angular Material**: solo en 2 `.ts` (`utils/confirm-dialog` y `services/modal-dialog.service`) para diálogos. Tema `cyan-orange.css`/`deeppurple-amber.css` cargado en `angular.json` pero prácticamente sin componentes Material.
- **`src/styles/design-tokens.css`** (paleta azul + slate, con `@layer base`): importado en `styles.css:5` pero sus tokens `--color-primary-500` etc. tienen **0 usos** en estilos de componentes (`var(--color-primary-*-[0-9])` → 0). **Archivo de tokens efectivamente muerto.**
- 42 CSS de componente (`*.component.css`, 0 SCSS), 15 con `@media`. Solo **3** consumen las variables runtime de `styles.css`; el resto usa valores hardcodeados → espaciados/colores ad-hoc por componente.

**Conflicto de color crítico dentro de la propia app:** `primary` = teal `#0d9488` (styles.css runtime) vs azul `#3b82f6` (tailwind.config.js + design-tokens.css). Coexisten dos "colores primarios" según qué mecanismo estilice cada elemento.

- **Botones:** `.btn` global define `hover` (invierte fondo/color, `styles.css:59,61,63,65`), `.active`, `.btn-sm`. No hay estados `disabled`/`loading` estandarizados globalmente. Focus: `.form-control:focus` sí (`box-shadow` teal, `styles.css:70`), botones no.
- **Inputs:** `.form-control` con `:focus` ring teal `rgba(13,148,136,.15)` (`styles.css:70`). Estados `error`/`invalid` no globales (dependen del componente).
- **Tablas:** `.table` con `thead` slate-900, striped/hover definidos globalmente (`styles.css:50-54`) — consistente donde se usa.
- **Badges/Cards/Modales/Alerts:** `.badge` global mínimo (`styles.css:100`); cards/modales/alerts sin componente global → cada pantalla los resuelve ad-hoc.
- **Tipografía:** `styles.css` body en `'Roboto'` (`font-family` en `html,body`), pero `tailwind.config.js` declara `sans: ['Inter', ...]`. Otra incoherencia tipográfica interna.
- **Iconografía:** No determinado un set único (no hay dependencia de icon-font tipo Material Icons wired de forma central; revisión no concluyente).

### 5. Pantallas / flujos sin implementación
- **25 pantallas** son placeholder `EnConstruccionComponent` (ver §3): incluye módulos completos aún vacíos — Servicio Técnico, Informes, Contabilidad (Libro IVA, Retenciones, Libro Mayor, Facturación electrónica), gestión Ecommerce, Usuarios/Roles/Auditoría, Importaciones.
- Formularios de factura (`sales-invoice-form`, `purchase-invoice-form`) existen pero **desconectados del routing** (huérfanos §1): la creación real va por `customer-invoice`/`supplier-invoice`.
- Implementado y vivo: Productos, Marcas, Categorías, Proveedores (+cuenta corriente, factura, lista de precios), Clientes, Comprobantes de venta, Caja, Inventario (sessions), Quotes, Analytics (echarts), Dashboard, Auth completo, Configuración (empresas/sucursales).

### 6. Estado CSS/SCSS y esfuerzo Tailwind
- Base de estilos **fragmentada**: hay tokens (`design-tokens.css`) pero **sin adopción**; hay Tailwind pero solo para layout; hay un mini-framework hand-rolled que es el que realmente pinta; Bootstrap y jQuery son dependencias muertas.
- **Esfuerzo de consolidación en Tailwind: MEDIO.** Tailwind ya está instalado y configurado con paleta/espaciados/sombras. El trabajo no es introducirlo sino *migrar* las ~29 plantillas con clases Bootstrap-like + los 42 CSS ad-hoc a utilidades Tailwind y unificar el color primario (decidir teal vs azul). Retirar Bootstrap/jQuery y el `design-tokens.css` muerto reduce ruido. Medio (no bajo) por el volumen de componentes y por los conflictos de color/tipografía a reconciliar.

---

## Portal Ecommerce (ecommerce)

### 1. Componentes huérfanos
- **Ninguno.** Las 9 features (`home`, `catalog`, `product-detail`, `cart`, `checkout`, `brands`, `news`, `favorites`, `account`) están todas enrutadas en `app/app.routes.ts`. Los 6 shared (`topbar`, `navbar`, `megamenu`, `footer`, `toast`, `product-card`) están en uso: los 5 de layout en `app/app.ts` (`app.html`), y `product-card` (`app-product-card`) inline en `home`, `catalog`, `favorites`, `product-detail` (verificado: usan `template:` inline, no `templateUrl`; solo hay 1 `.html` en toda la app).

### 2. Servicios huérfanos
- **Ninguno.** Los 5 servicios (`CartService`, `FavoritesService`, `ProductService`, `TenantService`, `ToastService`) están inyectados en múltiples componentes (p. ej. `ProductService` y `ToastService` en 8 archivos cada uno).
- `TenantService` aplica theming multi-tenant escribiendo CSS vars en runtime — pero sobre `--red`/`--red-dark` (`tenant.service.ts:24-25`), **no** sobre `--primary`, lo que parece un bug menor de theming (la marca del tenant no cambia el color primario verde).
- **Carpeta stub:** `app/core/interceptors/` está **vacía** (sin archivos). Candidata a limpieza.

### 3. Rutas muertas y enlaces rotos
- `pedidos` redirige a `cuenta` (`app.routes.ts`), y `checkout` enlaza `routerLink="/pedidos"` en la pantalla de confirmación (`checkout.component.ts:55`) → resuelve a `cuenta`. No roto, pero "Ver mis pedidos" lleva a la cuenta genérica.
- Wildcard `**` → `''`. Sin rutas muertas.

### 4. Consistencia visual (granular)
- **Sistema de diseño único y coherente** en `src/styles.css` (427 líneas, 55 CSS vars) con tokens semánticos: `--primary #1a6b3a` (verde oscuro estilo Thomann), escala de grises, semánticos (`--red/--green/--orange/--blue`), tipografía (`--font-body` Inter, `--font-display` Source Sans 3), escala `--text-xs..lg`. Muy superior en orden al backoffice.
- Componentes usan clases consistentes: `.btn-outline`, `.btn-next`, `.btn-confirm`, `.form-input`, `.form-label`, `.step`/`.step-badge`, `.pay-options`. Estados: `.invalid` en inputs (`checkout.component.ts:118`), `[disabled]` en botones de avance (`checkout.component.ts:142`).
- **Responsive:** cada componente define `@media` propios (navbar 3, footer 3, home 3, catalog 2, checkout 2, account 2, topbar 2, product-detail 1, megamenu 1, cart 1) + 3 en `styles.css`. Cobertura mobile razonable, crítica para portal.
- **Dependencia externa:** `styles.css:9` importa Google Fonts vía `@import url('https://fonts.googleapis.com/...')` — dependencia de red en runtime (riesgo offline/SSR/privacidad).
- Iconografía: emojis inline (p. ej. `📦`, `🎉` en checkout) en lugar de icon set → informal pero consistente dentro del portal.

### 5. Pantallas / flujos sin implementación
- **Checkout: COMPLETO a nivel de UI pero simulado.** `checkout.component.ts` (760 líneas) implementa flujo de 3 pasos (contacto+dirección con Reactive Forms, método de envío, método de pago con campos de tarjeta `cardNum/cardExp/cardCvv/cardHolder`) + pantalla "Pedido confirmado".
- **Sin backend:** `confirmOrder()` (`checkout.component.ts:754-759`) solo hace `cart.clear()`, `confirmed.set(true)` y un toast; el nº de pedido `#RM-2025-48291` está **hardcodeado** en el template (`checkout.component.ts:45`). No hay llamada HTTP.
- **Toda la app es prototipo con datos mock:** `product.service.ts:3` importa `PRODUCTS` de `core/data/mock-data.ts`; `HttpClient` se provee en `app.config.ts` pero **no se inyecta en ningún componente/servicio** (grep: solo en `app.config.ts`). No hay integración con backend real.

### 6. Estado CSS/SCSS y esfuerzo Tailwind
- CSS **global centralizado y tokenizado**, sin Material/Bootstrap/Tailwind. Limpio y mantenible.
- **Esfuerzo de adopción de Tailwind: ALTO.** No está instalado (deps mínimas). Habría que añadir toolchain (postcss/tailwind), mapear los 55 tokens a `tailwind.config`, y reescribir clases `.btn-*`/`.form-*`/layout de las plantillas inline. Como el sistema actual ya es coherente, el ROI de migrar es bajo salvo por alinear con el backoffice.

---

## Comparativa e inconsistencias entre apps

### ¿Comparten tokens de color / tipografía?
**No. Divergen por completo.** No hay archivo de tokens compartido ni convención común.

| Aspecto | Backoffice (web-client) | Portal (ecommerce) |
|---------|-------------------------|--------------------|
| Color primario | **Teal `#0d9488`** (runtime) / **Azul `#3b82f6`** (tailwind+tokens) — inconsistente incluso internamente | **Verde `#1a6b3a`** |
| Nomenclatura tokens | `--color-primary-500`, `--color-slate-*` (escala) + `--color-primary` (alias) | `--primary`, `--primary-dark`, `--gray-*`, semánticos `--ink/--line/--surface` |
| Tipografía | Roboto (body) / Inter (tailwind) — incoherente | Inter + Source Sans 3 (coherente) |
| Escala espaciado | Tailwind `xs..3xl` (no usada realmente) | `--space-*` propia (usada) |
| Fuente de fonts | local/sistema | Google Fonts CDN (`@import`) |

**Tres colores primarios distintos en total** (teal, azul, verde) y dos convenciones de tokens irreconciliables. **No comparten identidad de marca.**

### Madurez relativa
- **Backoffice = app madura pero de estilo caótico:** mucha funcionalidad real (ventas, compras, inventario, caja, analytics, auth, config), pero con 3 sistemas de estilo solapados, dependencias muertas (Bootstrap, jQuery, `design-tokens.css`), ~11 componentes/artefactos huérfanos y 25 pantallas placeholder.
- **Portal = app menos funcional pero de estilo más limpio:** prototipo UI sin backend (todo mock), pero con un design system único, tokenizado y responsive, y 0 huérfanos.

### Implicación para un design system común
Para un design system unificado hay que **decidir un color primario único** (hoy hay 3), unificar tipografía (Roboto vs Inter vs Source Sans 3) y una convención de tokens (`--color-primary-500` vs `--primary`). El portal aporta el sistema de tokens más limpio como base; el backoffice aporta la cobertura de componentes. Recomendable: extraer los tokens del portal como paquete compartido y migrar el backoffice a él (eliminando de paso Bootstrap/jQuery/`design-tokens.css` muertos). Adopción de Tailwind: partir del backoffice (ya lo tiene) y decidir si el portal lo adopta (esfuerzo alto).
