import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeFilterComponent, DateRange } from '../../components/time-filter/time-filter.component';
import { SalesTrendsChartComponent } from '../../components/sales-trends-chart/sales-trends-chart.component';
import { RevenueByCategoryChartComponent } from '../../components/revenue-by-category-chart/revenue-by-category.component';
import { TopProductsChartComponent } from '../../components/top-products-chart/top-products-chart.component';
import { PaymentStatusChartComponent } from '../../components/payment-status-chart/payment-status-chart.component';
import { InventoryAlertsChartComponent } from '../../components/inventory-alerts-chart/inventory-alerts-chart.component';
import { CashFlowChartComponent } from '../../components/cash-flow-chart/cash-flow-chart.component';
import { SalesByPaymentMethodChartComponent } from '../../components/sales-by-payment-method-chart/sales-by-payment-method-chart.component';

@Component({
  selector: 'app-analytics-home',
  standalone: true,
  imports: [
    CommonModule,
    TimeFilterComponent,
    SalesTrendsChartComponent,
    RevenueByCategoryChartComponent,
    TopProductsChartComponent,
    PaymentStatusChartComponent,
    InventoryAlertsChartComponent,
    CashFlowChartComponent,
    SalesByPaymentMethodChartComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold text-gray-900">Analytics</h1>
        <p class="mt-2 text-gray-600">Comprehensive business intelligence and insights</p>
      </div>

      <!-- Time Filter -->
      <app-time-filter (dateRangeSelected)="onDateRangeChange($event)" />

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Sales Trends -->
        <div class="lg:col-span-2">
          <app-sales-trends-chart 
            [startDate]="startDate()" 
            [endDate]="endDate()" 
          />
        </div>

        <!-- Revenue by Category -->
        <app-revenue-by-category-chart 
          [startDate]="startDate()" 
          [endDate]="endDate()" 
        />

        <!-- Payment Status -->
        <app-payment-status-chart 
          [startDate]="startDate()" 
          [endDate]="endDate()" 
        />

        <!-- Top Products -->
        <app-top-products-chart 
          [startDate]="startDate()" 
          [endDate]="endDate()" 
        />

        <!-- Inventory Alerts -->
        <app-inventory-alerts-chart 
          [startDate]="startDate()" 
          [endDate]="endDate()" 
        />

        <!-- Cash Flow -->
        <div class="lg:col-span-2">
          <app-cash-flow-chart 
            [startDate]="startDate()" 
            [endDate]="endDate()" 
          />
        </div>

        <!-- Sales by Payment Method -->
        <app-sales-by-payment-method-chart 
          [startDate]="startDate()" 
          [endDate]="endDate()" 
        />
      </div>
    </div>
  `
})
export class AnalyticsHomeComponent {
  startDate = signal('');
  endDate = signal('');

  constructor() {
    // Initialize with last 30 days by default
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.startDate.set(this.formatDate(thirtyDaysAgo));
    this.endDate.set(this.formatDate(today));
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
