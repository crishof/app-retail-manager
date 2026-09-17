import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';

import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, RevenueByCategoryData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';

@Component({
  selector: 'app-revenue-by-category-chart',
  standalone: true,
  imports: [EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Revenue by Category</h3>
        <p class="text-sm text-gray-500">Sales distribution across product categories</p>
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
export class RevenueByCategoryChartComponent {
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
    this.analyticsService.getRevenueByCategory(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: RevenueByCategoryData[]): EChartsOption {
    const categories = data.map(d => d.category);
    const revenues = data.map(d => d.revenue);
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6'  // Purple
    ];

    return {
      responsive: true,
      maintainAspectRatio: true,
      grid: {
        left: '3%',
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
        type: 'category',
        data: categories,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
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
      series: [
        {
          data: revenues,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1e40af' }
            ]) as any
          }
        } as any
      ]
    };
  }
}
