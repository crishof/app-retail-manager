import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from '../../shared/layouts/dashboard-layout/dashboard-layout.component';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { authGuard } from '../../core/auth/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardHomeComponent,
        data: { title: 'Dashboard' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        data: { title: 'Profile' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'Settings' }
      }
    ]
  }
];
