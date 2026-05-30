import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/product/products/products.component';
import { ProductDetailsComponent } from './pages/product/product-details/product-details.component';
import { ProductEditComponent } from './pages/product/product-edit/product-edit.component';
import { BrandComponent } from './pages/brand/brand/brand.component';
import { BrandDetailsComponent } from './pages/brand/brand-details/brand-details.component';
import { BrandEditComponent } from './pages/brand/brand-edit/brand-edit.component';
import { BrandCreateComponent } from './pages/brand/brand-create/brand-create.component';
import { CategoryComponent } from './pages/category/category/category.component';
import { CategoryDetailsComponent } from './pages/category/category-details/category-details.component';
import { SupplierComponent } from './pages/supplier/supplier/supplier.component';
import { SupplierDetailsComponent } from './pages/supplier/supplier-details/supplier-details.component';
import { SupplierFormComponent } from './pages/supplier/supplier-form/supplier-form.component';
import { SupplierInvoiceComponent } from './pages/supplier/supplier-invoice/supplier-invoice.component';
import { SupplierPriceListComponent } from './pages/supplier-price-list/supplier-price-list.component';
import { CustomerInvoiceComponent } from './pages/customer/customer-invoice/customer-invoice.component';
import { CustomerVoucherListComponent } from './pages/customer/customer-voucher-list/customer-voucher-list.component';
import { CustomerVoucherDetailComponent } from './pages/customer/customer-voucher-detail/customer-voucher-detail.component';
import { CustomerComponent } from './pages/customer/customer/customer.component';
import { CashComponent } from './pages/cash/cash.component';
import { BranchesComponent } from './pages/settings/branches/branches.component';
import { CompaniesComponent } from './pages/settings/companies/companies.component';
import { EnConstruccionComponent } from './shared/en-construccion/en-construccion.component';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { DashboardHomeComponent } from './features/dashboard/pages/dashboard-home/dashboard-home.component';

export const routes: Routes = [
  // ── Auth / Landing Pages ───────────────────────────
  {
    path: 'landing',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // ── Dashboard ──────────────────────────────────────
  { path: 'dashboard', component: DashboardHomeComponent, canActivate: [authGuard] },
  {
    path: 'dashboard/profile',
    loadComponent: () => import('./features/dashboard/pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: { title: 'Profile' }
  },
  {
    path: 'dashboard/settings',
    loadComponent: () => import('./features/dashboard/pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
    data: { title: 'Settings' }
  },
  {
    path: 'dashboard/analytics',
    loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes),
    canActivate: [authGuard],
    data: { title: 'Analytics' }
  },

  // ── Entrada ────────────────────────────────────────
  { path: '', redirectTo: 'landing/login', pathMatch: 'full' },

  // ── Catálogo ───────────────────────────────────────
  { path: 'products',          component: ProductsComponent, canActivate: [authGuard] },
  { path: 'products/:id',      component: ProductDetailsComponent, canActivate: [authGuard] },
  { path: 'products/:id/edit', component: ProductEditComponent, canActivate: [authGuard] },
  { path: 'brand',             component: BrandComponent, canActivate: [authGuard] },
  { path: 'brand/create',      component: BrandCreateComponent, canActivate: [authGuard] },
  { path: 'brand/:id',         component: BrandDetailsComponent, canActivate: [authGuard] },
  { path: 'brand/:id/edit',    component: BrandEditComponent, canActivate: [authGuard] },
  { path: 'category',          component: CategoryComponent, canActivate: [authGuard] },
  { path: 'category/:id',      component: CategoryDetailsComponent, canActivate: [authGuard] },

  // ── Ventas / Comprobantes ──────────────────────────
  { path: 'customerInvoice',             component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'FACTURA_B' } },
  { path: 'comprobantes/nota-credito',   component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'NC_B' } },
  { path: 'comprobantes/nota-debito',    component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'ND_B' } },
  { path: 'comprobantes/presupuesto',    component: CustomerInvoiceComponent, canActivate: [authGuard], data: { voucherType: 'PRESUPUESTO' } },
  { path: 'comprobantes/ver',            component: CustomerVoucherListComponent, canActivate: [authGuard] },
  { path: 'comprobantes/ver/:id',        component: CustomerVoucherDetailComponent, canActivate: [authGuard] },
  { path: 'comprobantes/recibos',        component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Recibos' } },
  { path: 'comprobantes/pagos',          component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Pagos' } },

  // ── Proveedores ────────────────────────────────────
  { path: 'supplier',             component: SupplierComponent, canActivate: [authGuard] },
  { path: 'supplier/new',         component: SupplierFormComponent, canActivate: [authGuard] },
  { path: 'supplier/:id/edit',    component: SupplierFormComponent, canActivate: [authGuard] },
  { path: 'supplier/:id',         component: SupplierDetailsComponent, canActivate: [authGuard] },
  { path: 'supplierInvoice',      component: SupplierInvoiceComponent, canActivate: [authGuard] },
  { path: 'supplierPriceList',    component: SupplierPriceListComponent, canActivate: [authGuard] },
  { path: 'supplier/cuenta-corriente', component: SupplierComponent, canActivate: [authGuard], data: { defaultTab: 'cuenta-corriente' } },
  { path: 'statementAccount',          redirectTo: 'supplier/cuenta-corriente', pathMatch: 'full' },
  { path: 'statementAccount/:id',      redirectTo: 'supplier/cuenta-corriente', pathMatch: 'full' },

  // ── Clientes ───────────────────────────────────────
  { path: 'clientes', component: CustomerComponent, canActivate: [authGuard] },

  // ── Almacén ────────────────────────────────────────
  { path: 'almacen/remito',     component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Remito' } },
  { path: 'almacen/inventario', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Inventario' } },

  // ── Caja ───────────────────────────────────────────
  { path: 'caja', component: CashComponent, canActivate: [authGuard] },

  // ── Ecommerce ──────────────────────────────────────
  { path: 'ecommerce/ordenes',   component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Órdenes Ecommerce' } },
  { path: 'ecommerce/config',    component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Configuración Ecommerce' } },
  { path: 'ecommerce/seo',       component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'SEO' } },
  { path: 'ecommerce/etiquetas', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Etiquetas' } },

  // ── Servicio Técnico ───────────────────────────────
  { path: 'servicio-tecnico',        component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Órdenes de Servicio Técnico' } },
  { path: 'servicio-tecnico/turnos', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Turnos' } },

  // ── Informes ───────────────────────────────────────
  { path: 'informes/ventas',      component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Ventas en Tiempo Real' } },
  { path: 'informes/movimientos', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Movimientos de Artículos' } },
  { path: 'informes/excel',       component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Exportar a Excel' } },

  // ── Contabilidad ───────────────────────────────────
  { path: 'contabilidad/libro-iva',   component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Libro IVA' } },
  { path: 'contabilidad/retenciones', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Retenciones de IIBB' } },
  { path: 'contabilidad/libro-mayor', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Libro Mayor' } },
  { path: 'contabilidad/facturacion-electronica', component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Facturación electrónica · VeriFactu / AEAT' } },

  // ── Configuración ──────────────────────────────────
  { path: 'configuracion/general',              component: CompaniesComponent, canActivate: [authGuard] },
  { path: 'configuracion/general/empresas',     component: CompaniesComponent, canActivate: [authGuard] },
  { path: 'configuracion/general/sucursales',   component: BranchesComponent, canActivate: [authGuard] },
  { path: 'configuracion/general/depositos',    redirectTo: 'configuracion/general/sucursales', pathMatch: 'full' },
  { path: 'configuracion/usuarios',             component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Usuarios' } },
  { path: 'configuracion/archivos',             component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Archivos Maestros' } },
  { path: 'importaciones',                      component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Importaciones' } },

  // ── Administración ────────────────────────────────
  { path: 'admin',                              redirectTo: 'configuracion/general', pathMatch: 'full' },
  { path: 'admin/roles',                        component: EnConstruccionComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'], titulo: 'Roles y permisos' } },
  { path: 'admin/auditoria',                    component: EnConstruccionComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'], titulo: 'Auditoría y actividad administrativa' } },
  { path: 'ayuda',                              component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Centro de ayuda' } },
  { path: 'notificaciones',                     component: EnConstruccionComponent, canActivate: [authGuard], data: { titulo: 'Notificaciones' } },

  // ── Fallback ───────────────────────────────────────
  { path: '**', redirectTo: 'landing/login', pathMatch: 'full' },
];
