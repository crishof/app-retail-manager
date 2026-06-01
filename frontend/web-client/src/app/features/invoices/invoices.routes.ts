import { Routes } from '@angular/router';
import { SalesInvoiceListComponent } from './pages/sales-invoice-list/sales-invoice-list.component';
import { SalesInvoiceDetailComponent } from './pages/sales-invoice-detail/sales-invoice-detail.component';
import { SalesInvoiceFormComponent } from './pages/sales-invoice-form/sales-invoice-form.component';
import { PurchaseInvoiceListComponent } from './pages/purchase-invoice-list/purchase-invoice-list.component';
import { PurchaseInvoiceDetailComponent } from './pages/purchase-invoice-detail/purchase-invoice-detail.component';
import { PurchaseInvoiceFormComponent } from './pages/purchase-invoice-form/purchase-invoice-form.component';

export const invoicesRoutes: Routes = [
  // Sales Invoices
  {
    path: 'sales',
    children: [
      {
        path: '',
        component: SalesInvoiceListComponent,
        data: { title: 'Sales Invoices' }
      },
      {
        path: 'new',
        component: SalesInvoiceFormComponent,
        data: { title: 'Create Sales Invoice' }
      },
      {
        path: ':id',
        component: SalesInvoiceDetailComponent,
        data: { title: 'Sales Invoice Details' }
      }
    ]
  },
  // Purchase Invoices
  {
    path: 'purchase',
    children: [
      {
        path: '',
        component: PurchaseInvoiceListComponent,
        data: { title: 'Purchase Invoices' }
      },
      {
        path: 'new',
        component: PurchaseInvoiceFormComponent,
        data: { title: 'Create Purchase Invoice' }
      },
      {
        path: ':id',
        component: PurchaseInvoiceDetailComponent,
        data: { title: 'Purchase Invoice Details' }
      }
    ]
  },
  // Default route
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full'
  }
];
