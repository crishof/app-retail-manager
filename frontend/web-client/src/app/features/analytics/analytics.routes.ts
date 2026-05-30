import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { AnalyticsHomeComponent } from './pages/analytics-home/analytics-home.component';

export const analyticsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AnalyticsHomeComponent,
        data: { title: 'Analytics' }
      }
    ]
  }
];
