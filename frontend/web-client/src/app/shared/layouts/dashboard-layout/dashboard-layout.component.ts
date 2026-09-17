import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-screen bg-gray-50">
      <!-- Header -->
      <app-header></app-header>

      <!-- Main Content Area -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <app-sidebar></app-sidebar>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto lg:ml-64">
          <div class="p-4 sm:p-6 lg:p-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardLayoutComponent implements OnInit {
  authService = inject(AuthService);
  store = inject(AuthStore);

  ngOnInit(): void {
    // Ensure user data is loaded
    this.authService.getCurrentUser().subscribe({
      error: (error) => {
        console.error('Failed to load user data:', error);
      }
    });
  }
}
