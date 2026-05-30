import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { DashboardDataService, DashboardMetrics } from '../../../../core/services/dashboard-data.service';
import { SalesDataService, Invoice } from '../../../../core/services/sales-data.service';
import { InventoryDataService, ProductStock } from '../../../../core/services/inventory-data.service';

interface DashboardWidget {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  route?: string;
  isLoading?: boolean;
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
        @if (lastRefresh()) {
          <p class="text-xs text-blue-200 mt-3">Last updated: {{ lastRefresh() | date: 'short' }}</p>
        }
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (widget of metricsWidgets(); track widget.title) {
          <div
            [routerLink]="widget.route"
            class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 min-h-[150px]"
            [ngClass]="widget.color"
          >
            @if (widget.isLoading) {
              <div class="flex items-center justify-center h-full">
                <div class="animate-spin">⏳</div>
              </div>
            } @else {
              <div class="flex items-center justify-between h-full">
                <div>
                  <p class="text-gray-600 text-sm font-medium">{{ widget.title }}</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">{{ widget.value }}</p>
                  @if (widget.trend) {
                    <p class="text-xs mt-2" [ngClass]="widget.trend.includes('+') ? 'text-green-600' : 'text-red-600'">
                      {{ widget.trend }}
                    </p>
                  }
                </div>
                <div class="text-4xl">{{ widget.icon }}</div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Sales & Inventory Overview -->
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
              routerLink="/products"
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

        <!-- Pending Invoices -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Pending Invoices</h2>
          @if (pendingInvoicesLoading()) {
            <div class="text-center py-4">
              <span class="animate-spin text-2xl">⏳</span>
            </div>
          } @else if (pendingInvoices().length > 0) {
            <div class="space-y-3">
              @for (invoice of pendingInvoices() | slice: 0: 3; track invoice.id) {
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ invoice.number }}</p>
                    <p class="text-sm text-gray-600">{{ invoice.customerName }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{{ formatCurrency(invoice.amount) }}</p>
                    <span
                      class="text-xs font-medium px-2 py-1 rounded"
                      [ngClass]="{
                        'bg-yellow-100 text-yellow-800': invoice.status === 'PENDING',
                        'bg-red-100 text-red-800': invoice.status === 'OVERDUE'
                      }"
                    >
                      {{ invoice.status }}
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-500">
              <p class="text-lg">✓ All invoices paid!</p>
            </div>
          }
        </div>
      </div>

      <!-- Low Stock Alert & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Low Stock Products -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">⚠️ Low Stock Products</h2>
          @if (lowStockLoading()) {
            <div class="text-center py-4">
              <span class="animate-spin text-2xl">⏳</span>
            </div>
          } @else if (lowStockProducts().length > 0) {
            <div class="space-y-3">
              @for (product of lowStockProducts() | slice: 0: 4; track product.id) {
                <div class="flex items-center justify-between p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ product.name }}</p>
                    <p class="text-xs text-gray-600">SKU: {{ product.sku }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-yellow-600">{{ product.quantity }} / {{ product.minQuantity }}</p>
                    <p class="text-xs text-gray-500">in stock</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-8 text-gray-500">
              <p class="text-lg">✓ All stock levels good!</p>
            </div>
          }
        </div>

        <!-- Info Cards -->
         <div class="space-y-4">
           <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
             <a routerLink="/dashboard/analytics" class="block group">
               <h3 class="font-bold text-blue-900 mb-2">📊 Analytics Dashboard</h3>
               <p class="text-sm text-blue-800 mb-4">
                 View detailed charts: sales trends, revenue, inventory, cash flow, and payment status.
               </p>
               <span class="text-blue-600 group-hover:text-blue-800 text-sm font-medium">Open Analytics →</span>
             </a>
           </div>
           <div class="bg-green-50 border border-green-200 rounded-lg p-6">
             <h3 class="font-bold text-green-900 mb-2">✨ Performance</h3>
             <p class="text-sm text-green-800 mb-4">
               Your business is performing 12% better than last month.
             </p>
             <a routerLink="/dashboard/analytics" class="text-green-600 hover:text-green-800 text-sm font-medium">View Details →</a>
           </div>
         </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardHomeComponent implements OnInit {
  store = inject(AuthStore);
  dashboardDataService = inject(DashboardDataService);
  salesDataService = inject(SalesDataService);
  inventoryDataService = inject(InventoryDataService);

  // State signals
  metrics = signal<DashboardMetrics | null>(null);
  pendingInvoices = signal<Invoice[]>([]);
  lowStockProducts = signal<ProductStock[]>([]);
  lastRefresh = signal<Date | null>(null);

  // Loading states
  metricsLoading = signal(true);
  pendingInvoicesLoading = signal(true);
  lowStockLoading = signal(true);

  // Computed values
  metricsWidgets = computed(() => {
    const m = this.metrics();
    const isLoading = this.metricsLoading();

    const defaultWidgets: DashboardWidget[] = [
      { title: 'Total Revenue', value: '$0', icon: '💰', color: 'border-blue-500', trend: '', route: '/informes/ventas', isLoading },
      { title: 'Orders', value: '0', icon: '📦', color: 'border-green-500', trend: '', route: '/comprobantes/ver', isLoading },
      { title: 'Customers', value: '0', icon: '👥', color: 'border-purple-500', trend: '', route: '/clientes', isLoading },
      { title: 'Products', value: '0', icon: '📦', color: 'border-orange-500', trend: '', route: '/products', isLoading }
    ];

    if (!m) {
      return defaultWidgets;
    }

    const totalRevenue = Number(m.totalRevenue ?? 0);
    const totalOrders = Number(m.totalOrders ?? 0);
    const totalCustomers = Number(m.totalCustomers ?? 0);
    const totalProducts = Number(m.totalProducts ?? 0);
    const revenueChange = Number(m.revenueChange ?? 0);
    const ordersChange = Number(m.ordersChange ?? 0);
    const customersChange = Number(m.customersChange ?? 0);
    const productsChange = Number(m.productsChange ?? 0);

    return [
      {
        title: 'Total Revenue',
        value: this.formatCurrency(totalRevenue),
        icon: '💰',
        color: 'border-blue-500',
        trend: revenueChange >= 0 ? `↑ ${revenueChange}% this month` : `↓ ${Math.abs(revenueChange)}% this month`,
        route: '/informes/ventas',
        isLoading: false
      },
      {
        title: 'Orders',
        value: totalOrders.toString(),
        icon: '📦',
        color: 'border-green-500',
        trend: ordersChange >= 0 ? `↑ ${ordersChange} new` : `${ordersChange}`,
        route: '/comprobantes/ver',
        isLoading: false
      },
      {
        title: 'Customers',
        value: totalCustomers.toString(),
        icon: '👥',
        color: 'border-purple-500',
        trend: customersChange >= 0 ? `↑ ${customersChange} new` : `${customersChange}`,
        route: '/clientes',
        isLoading: false
      },
      {
        title: 'Products',
        value: totalProducts.toString(),
        icon: '📦',
        color: 'border-orange-500',
        trend: productsChange >= 0 ? `↑ ${productsChange} added` : `${productsChange}`,
        route: '/products',
        isLoading: false
      }
    ];
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load dashboard metrics
    this.dashboardDataService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.lastRefresh.set(new Date());
        this.metricsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load metrics:', error);
        this.metricsLoading.set(false);
      }
    });

    // Load pending invoices
    this.salesDataService.getPendingInvoices().subscribe({
      next: (invoices) => {
        this.pendingInvoices.set(invoices);
        this.pendingInvoicesLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pending invoices:', error);
        this.pendingInvoicesLoading.set(false);
      }
    });

    // Load low stock products
    this.inventoryDataService.getLowStockProducts().subscribe({
      next: (products) => {
        this.lowStockProducts.set(products);
        this.lowStockLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load low stock products:', error);
        this.lowStockLoading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
