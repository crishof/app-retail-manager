import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
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
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CustomerInvoiceComponent } from './pages/customer/customer-invoice/customer-invoice.component';
import { CustomerVoucherListComponent } from './pages/customer/customer-voucher-list/customer-voucher-list.component';
import { CustomerVoucherDetailComponent } from './pages/customer/customer-voucher-detail/customer-voucher-detail.component';
import { CustomerComponent } from './pages/customer/customer/customer.component';
import { CashComponent } from './pages/cash/cash.component';
import { BranchesComponent } from './pages/settings/branches/branches.component';
import { CompaniesComponent } from './pages/settings/companies/companies.component';
import { EnConstruccionComponent } from './shared/en-construccion/en-construccion.component';

export const routes: Routes = [
  // ── Público ────────────────────────────────────────
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },

  // ── Catálogo ───────────────────────────────────────
  { path: 'products',          component: ProductsComponent },
  { path: 'products/:id',      component: ProductDetailsComponent },
  { path: 'products/:id/edit', component: ProductEditComponent },
  { path: 'brand',             component: BrandComponent },
  { path: 'brand/create',      component: BrandCreateComponent },
  { path: 'brand/:id',         component: BrandDetailsComponent },
  { path: 'brand/:id/edit',    component: BrandEditComponent },
  { path: 'category',          component: CategoryComponent },
  { path: 'category/:id',      component: CategoryDetailsComponent },

  // ── Ventas / Comprobantes ──────────────────────────
  { path: 'customerInvoice',             component: CustomerInvoiceComponent, data: { voucherType: 'FACTURA_B' } },
  { path: 'comprobantes/nota-credito',   component: CustomerInvoiceComponent, data: { voucherType: 'NC_B' } },
  { path: 'comprobantes/nota-debito',    component: CustomerInvoiceComponent, data: { voucherType: 'ND_B' } },
  { path: 'comprobantes/presupuesto',    component: CustomerInvoiceComponent, data: { voucherType: 'PRESUPUESTO' } },
  { path: 'comprobantes/ver',            component: CustomerVoucherListComponent },
  { path: 'comprobantes/ver/:id',        component: CustomerVoucherDetailComponent },
  { path: 'comprobantes/recibos',        component: EnConstruccionComponent, data: { titulo: 'Recibos' } },
  { path: 'comprobantes/pagos',          component: EnConstruccionComponent, data: { titulo: 'Pagos' } },

  // ── Proveedores ────────────────────────────────────
  { path: 'supplier',             component: SupplierComponent },
  { path: 'supplier/new',         component: SupplierFormComponent },
  { path: 'supplier/:id/edit',    component: SupplierFormComponent },
  { path: 'supplier/:id',         component: SupplierDetailsComponent },
  { path: 'supplierInvoice',      component: SupplierInvoiceComponent },
  { path: 'supplierPriceList',    component: SupplierPriceListComponent },
  { path: 'supplier/cuenta-corriente', component: SupplierComponent, data: { defaultTab: 'cuenta-corriente' } },
  { path: 'statementAccount',          redirectTo: 'supplier/cuenta-corriente', pathMatch: 'full' },
  { path: 'statementAccount/:id',      redirectTo: 'supplier/cuenta-corriente', pathMatch: 'full' },

  // ── Clientes ───────────────────────────────────────
  { path: 'clientes', component: CustomerComponent },

  // ── Almacén ────────────────────────────────────────
  { path: 'almacen/remito',     component: EnConstruccionComponent, data: { titulo: 'Remito' } },
  { path: 'almacen/inventario', component: EnConstruccionComponent, data: { titulo: 'Inventario' } },

  // ── Caja ───────────────────────────────────────────
  { path: 'caja', component: CashComponent },

  // ── Ecommerce ──────────────────────────────────────
  { path: 'ecommerce/ordenes',   component: EnConstruccionComponent, data: { titulo: 'Órdenes Ecommerce' } },
  { path: 'ecommerce/config',    component: EnConstruccionComponent, data: { titulo: 'Configuración Ecommerce' } },
  { path: 'ecommerce/seo',       component: EnConstruccionComponent, data: { titulo: 'SEO' } },
  { path: 'ecommerce/etiquetas', component: EnConstruccionComponent, data: { titulo: 'Etiquetas' } },

  // ── Servicio Técnico ───────────────────────────────
  { path: 'servicio-tecnico',        component: EnConstruccionComponent, data: { titulo: 'Órdenes de Servicio Técnico' } },
  { path: 'servicio-tecnico/turnos', component: EnConstruccionComponent, data: { titulo: 'Turnos' } },

  // ── Informes ───────────────────────────────────────
  { path: 'informes/ventas',      component: EnConstruccionComponent, data: { titulo: 'Ventas en Tiempo Real' } },
  { path: 'informes/movimientos', component: EnConstruccionComponent, data: { titulo: 'Movimientos de Artículos' } },
  { path: 'informes/excel',       component: EnConstruccionComponent, data: { titulo: 'Exportar a Excel' } },

  // ── Contabilidad ───────────────────────────────────
  { path: 'contabilidad/libro-iva',   component: EnConstruccionComponent, data: { titulo: 'Libro IVA' } },
  { path: 'contabilidad/retenciones', component: EnConstruccionComponent, data: { titulo: 'Retenciones de IIBB' } },
  { path: 'contabilidad/libro-mayor', component: EnConstruccionComponent, data: { titulo: 'Libro Mayor' } },

  // ── Configuración ──────────────────────────────────
  { path: 'configuracion/general',              component: EnConstruccionComponent, data: { titulo: 'Configuración General' } },
  { path: 'configuracion/general/empresas',     component: CompaniesComponent },
  { path: 'configuracion/general/sucursales',   component: BranchesComponent },
  { path: 'configuracion/usuarios',             component: EnConstruccionComponent, data: { titulo: 'Usuarios' } },
  { path: 'configuracion/archivos',             component: EnConstruccionComponent, data: { titulo: 'Archivos Maestros' } },
  { path: 'importaciones',                      component: EnConstruccionComponent, data: { titulo: 'Importaciones' } },

  // ── Fallback ───────────────────────────────────────
  { path: '**', redirectTo: 'inicio', pathMatch: 'full' },
];
