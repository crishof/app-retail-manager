import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';

import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, PaymentStatusData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-payment-status-chart',
  standalone: true,
  imports: [EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Payment Status</h3>
        <p class="text-sm text-gray-500">Invoice payment distribution</p>
      </div>
    
      @if (isLoading()) {
        <div class="flex items-center justify-center h-80">
          <div class="text-gray-400">Loading...</div>
        </div>
      }
    
      @if (!isLoading()) {
        <div>
          <app-echarts-container [option]="chartOption()" />
        </div>
      }
    </div>
    `
})
export class PaymentStatusChartComponent {
  private analyticsService = inject(AnalyticsDataService);

  startDate = input<string>();
  endDate = input<string>();

  isLoading = signal(false);
  chartOption = signal<EChartsOption>({});

  constructor() {
    effect(() => {
      const start = this.startDate();
      const end = this.endDate();
      if (start && end) {
        this.loadData(start, end);
      }
    });
  }

  private loadData(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.analyticsService.getPaymentStatus(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: PaymentStatusData[]): EChartsOption {
    const colors = {
      'PAID': '#10b981',
      'PENDING': '#f59e0b',
      'OVERDUE': '#ef4444'
    };

    return {
      responsive: true,
      maintainAspectRatio: true,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff'
        },
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 10,
        textStyle: {
          color: '#666'
        }
      },
      series: [
        {
          name: 'Status',
          type: 'pie',
          radius: ['40%', '70%'],
          data: data.map(d => ({
            value: d.count,
            name: d.status,
            itemStyle: {
              color: colors[d.status as keyof typeof colors] || '#999'
            }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }
}
