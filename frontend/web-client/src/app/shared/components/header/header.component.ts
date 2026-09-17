import { Component, inject, input, output, OnInit } from '@angular/core';

import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore, User } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">R</span>
            </div>
            <span class="text-xl font-bold text-gray-900">RetailManager</span>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-8">
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Dashboard</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Catalog</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Sales</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Suppliers</a>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <!-- Desktop User Menu -->
            <div class="hidden sm:flex items-center gap-4">
              @if (store.currentUser()) {
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-gray-700">
                      {{ (store.currentUser()?.firstName || 'U').charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="hidden lg:block">
                    <p class="text-sm font-medium text-gray-900">
                      {{ store.currentUser()?.firstName || 'User' }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ store.currentUser()?.email }}
                    </p>
                  </div>
                </div>
              }
              
              <!-- User Menu Dropdown -->
              <div class="relative">
                <button
                  (click)="toggleUserMenu()"
                  class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                @if (showUserMenu) {
                  <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <a
                      routerLink="/dashboard/profile"
                      (click)="showUserMenu = false"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Profile
                    </a>
                    <a
                      routerLink="/dashboard/settings"
                      (click)="showUserMenu = false"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚙️ Settings
                    </a>
                    <div class="border-t border-gray-200 my-2"></div>
                    <button
                      (click)="logout()"
                      class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Mobile Menu Button -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        @if (showMobileMenu) {
          <nav class="md:hidden pb-4 space-y-2">
            <a href="#" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Dashboard</a>
            <a href="#" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Catalog</a>
            <a href="#" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Sales</a>
            <a href="#" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Suppliers</a>
            <div class="border-t border-gray-200 pt-2 mt-2">
              <a routerLink="/dashboard/profile" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Profile</a>
              <a routerLink="/dashboard/settings" class="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Settings</a>
              <button
                (click)="logout()"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-2"
              >
                Sign Out
              </button>
            </div>
          </nav>
        }
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent implements OnInit {
  store = inject(AuthStore);
  showUserMenu = false;
  showMobileMenu = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/landing/login']);
      },
      error: () => {
        // Logout failed but still redirect
        this.router.navigate(['/landing/login']);
      }
    });
  }

  ngOnInit(): void {
    // Fetch current user data
    this.authService.getCurrentUser().subscribe({
      error: () => {
        // User fetch failed - might indicate session expired
        this.router.navigate(['/landing/login']);
      }
    });
  }
}
