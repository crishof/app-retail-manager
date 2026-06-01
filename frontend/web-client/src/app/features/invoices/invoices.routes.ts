import { Routes } from '@angular/router';
import { SalesInvoiceListComponent } from './pages/sales-invoice-list/sales-invoice-list.component';

export const invoicesRoutes: Routes = [
  {
    path: '',
    component: SalesInvoiceListComponent,
    data: { title: 'Sales Invoices' }
  },
  {
    path: 'new',
    component: SalesInvoiceListComponent, // Placeholder - should create form component
    data: { title: 'Create Invoice' }
  },
  {
    path: ':id',
    component: SalesInvoiceListComponent, // Placeholder - should create detail component
    data: { title: 'Invoice Details' }
  }
];
