import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';

import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, SalesTrendData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-sales-trends-chart',
  standalone: true,
  imports: [EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Sales Trends</h3>
        <p class="text-sm text-gray-500">Daily sales and order volume</p>
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
export class SalesTrendsChartComponent {
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
    this.analyticsService.getSalesTrends(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: SalesTrendData[]): EChartsOption {
    const dates = data.map(d => d.date);
    const sales = data.map(d => d.sales);
    const orders = data.map(d => d.orders);

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
        }
      },
      legend: {
        top: 0,
        data: ['Sales ($)', 'Orders'],
        textStyle: {
          color: '#666'
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Sales ($)',
          position: 'left',
          axisLine: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#f3f4f6'
            }
          }
        },
        {
          type: 'value',
          name: 'Orders',
          position: 'right',
          axisLine: {
            show: false
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: 'Sales ($)',
          type: 'line',
          data: sales,
          smooth: true,
          yAxisIndex: 0,
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 2
          },
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.1)'
          }
        } as any,
        {
          name: 'Orders',
          type: 'line',
          data: orders,
          smooth: true,
          yAxisIndex: 1,
          itemStyle: {
            color: '#10b981',
            borderColor: '#047857',
            borderWidth: 2
          },
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.1)'
          }
        } as any
      ]
    };
  }
}
