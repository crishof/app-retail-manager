import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, SalesByPaymentMethodData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-sales-by-payment-method-chart',
  standalone: true,
  imports: [CommonModule, EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Sales by Payment Method</h3>
        <p class="text-sm text-gray-500">Revenue distribution by payment type</p>
      </div>

      <div *ngIf="isLoading()" class="flex items-center justify-center h-80">
        <div class="text-gray-400">Loading...</div>
      </div>

      <div *ngIf="!isLoading()">
        <app-echarts-container [option]="chartOption()" />
      </div>
    </div>
  `
})
export class SalesByPaymentMethodChartComponent {
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
    this.analyticsService.getSalesByPaymentMethod(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: SalesByPaymentMethodData[]): EChartsOption {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

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
        formatter: (params: any) => {
          if (params.data) {
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(params.data.value);
            return `${params.name}<br/>${formatted} (${params.percent}%)`;
          }
          return '';
        }
      },
      legend: {
        bottom: 10,
        textStyle: {
          color: '#666'
        }
      },
      series: [
        {
          name: 'Sales',
          type: 'pie',
          radius: ['40%', '70%'],
          data: data.map((d, i) => ({
            value: d.amount,
            name: d.method,
            itemStyle: {
              color: colors[i % colors.length]
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
