import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, TopProductData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-top-products-chart',
  standalone: true,
  imports: [CommonModule, EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Top Products</h3>
        <p class="text-sm text-gray-500">Best performing products by revenue</p>
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
export class TopProductsChartComponent {
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
    this.analyticsService.getTopProducts(startDate, endDate, 8).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: TopProductData[]): EChartsOption {
    const products = data.map(d => d.productName);
    const revenues = data.map(d => d.revenue);

    return {
      responsive: true,
      maintainAspectRatio: true,
      grid: {
        left: '20%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff'
        },
        formatter: (params: any) => {
          if (Array.isArray(params)) {
            const value = params[0].value;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(value);
            return `${params[0].name}<br/>${formatted}`;
          }
          return '';
        }
      },
      xAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: products,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      series: [
        {
          data: revenues,
          type: 'bar',
          itemStyle: {
            color: '#10b981'
          }
        } as any
      ]
    };
  }
}
