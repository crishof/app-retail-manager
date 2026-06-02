import { Routes } from '@angular/router';
import { SalesInvoiceListComponent } from './pages/sales-invoice-list/sales-invoice-list.component';
import { SalesInvoiceDetailComponent } from './pages/sales-invoice-detail/sales-invoice-detail.component';
import { PurchaseInvoiceListComponent } from './pages/purchase-invoice-list/purchase-invoice-list.component';
import { PurchaseInvoiceDetailComponent } from './pages/purchase-invoice-detail/purchase-invoice-detail.component';

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
        redirectTo: '/customerInvoice'
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
        redirectTo: '/supplierInvoice'
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
