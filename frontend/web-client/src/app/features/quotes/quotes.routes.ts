import { Routes } from '@angular/router';
import { QuoteListComponent } from './pages/quote-list/quote-list.component';
import { QuoteDetailComponent } from './pages/quote-detail/quote-detail.component';
import { QuoteFormComponent } from './pages/quote-form/quote-form.component';

export const quotesRoutes: Routes = [
  {
    path: '',
    component: QuoteListComponent,
    data: { title: 'Quotations' }
  },
  {
    path: 'new',
    component: QuoteFormComponent,
    data: { title: 'Create Quotation' }
  },
  {
    path: ':id',
    component: QuoteDetailComponent,
    data: { title: 'Quotation Details' }
  }
];
