import { Routes } from '@angular/router';
import { InventorySessionListComponent } from './pages/inventory-session-list/inventory-session-list.component';
import { InventorySessionDetailComponent } from './pages/inventory-session-detail/inventory-session-detail.component';
import { InventorySessionFormComponent } from './pages/inventory-session-form/inventory-session-form.component';

export const inventoryRoutes: Routes = [
  {
    path: '',
    component: InventorySessionListComponent,
    data: { title: 'Inventory Sessions' }
  },
  {
    path: 'new',
    component: InventorySessionFormComponent,
    data: { title: 'Create Inventory Session' }
  },
  {
    path: ':id',
    component: InventorySessionDetailComponent,
    data: { title: 'Inventory Session Details' }
  }
];
