import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';

interface DashboardWidget {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 class="text-3xl font-bold">Welcome back, {{ store.currentUser()?.firstName || 'User' }}!</h1>
        <p class="text-blue-100 mt-2">Here's what's happening with your business today.</p>
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (widget of widgets; track widget.title) {
          <div
            [routerLink]="widget.route"
            class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4"
            [ngClass]="widget.color"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm font-medium">{{ widget.title }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ widget.value }}</p>
                @if (widget.trend) {
                  <p class="text-xs text-green-600 mt-2">{{ widget.trend }}</p>
                }
              </div>
              <div class="text-4xl">{{ widget.icon }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Recent Activity Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Actions -->
        <div class="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div class="space-y-3">
            <a
              routerLink="/customerInvoice"
              class="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium text-sm transition"
            >
              ➕ Create Invoice
            </a>
            <a
              routerLink="/brand"
              class="block p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium text-sm transition"
            >
              ➕ Add Product
            </a>
            <a
              routerLink="/supplier/new"
              class="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium text-sm transition"
            >
              ➕ Add Supplier
            </a>
            <a
              routerLink="/clientes"
              class="block p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-700 font-medium text-sm transition"
            >
              ➕ Add Customer
            </a>
          </div>
        </div>

        <!-- Sales Overview -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Sales Overview</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Today's Sales</span>
              <span class="text-2xl font-bold text-gray-900">$0.00</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: 0%"></div>
            </div>
            <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p class="text-xs text-gray-500 uppercase">Invoices</p>
                <p class="text-xl font-bold text-gray-900">0</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Orders</p>
                <p class="text-xl font-bold text-gray-900">0</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Total</p>
                <p class="text-xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div class="space-y-4">
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">No recent transactions</p>
                <p class="text-sm text-gray-500">Start by creating your first invoice or order</p>
              </div>
              <span class="text-3xl">📭</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-bold text-blue-900 mb-2">📚 Getting Started</h3>
          <p class="text-sm text-blue-800 mb-4">
            Welcome to RetailManager! Start by exploring the dashboard and familiarizing yourself with the available tools.
          </p>
          <a href="#" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn more →</a>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 class="font-bold text-green-900 mb-2">✨ Pro Tip</h3>
          <p class="text-sm text-green-800 mb-4">
            Use keyboard shortcuts to navigate faster. Press '?' to see available shortcuts.
          </p>
          <a href="#" class="text-green-600 hover:text-green-800 text-sm font-medium">View shortcuts →</a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardHomeComponent {
  store = inject(AuthStore);

  widgets: DashboardWidget[] = [
    {
      title: 'Total Revenue',
      value: '$0.00',
      icon: '💰',
      color: 'border-blue-500',
      trend: '↑ 0% from last month',
      route: '/informes/ventas'
    },
    {
      title: 'Orders',
      value: 0,
      icon: '📦',
      color: 'border-green-500',
      trend: '↑ 0 this month',
      route: '/comprobantes/ver'
    },
    {
      title: 'Customers',
      value: 0,
      icon: '👥',
      color: 'border-purple-500',
      trend: '↑ 0 new this month',
      route: '/clientes'
    },
    {
      title: 'Products',
      value: 0,
      icon: '📦',
      color: 'border-orange-500',
      trend: '↑ 0 added this month',
      route: '/products'
    }
  ];
}
