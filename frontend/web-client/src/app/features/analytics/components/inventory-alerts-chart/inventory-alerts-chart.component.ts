import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, InventoryAlertData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-inventory-alerts-chart',
  standalone: true,
  imports: [CommonModule, EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
        <p class="text-sm text-gray-500">Low stock and out-of-stock items</p>
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
export class InventoryAlertsChartComponent {
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
    this.analyticsService.getInventoryAlerts(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: InventoryAlertData[]): EChartsOption {
    const dates = data.map(d => d.date);
    const lowStock = data.map(d => d.lowStock);
    const outOfStock = data.map(d => d.outOfStock);

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
        data: ['Low Stock', 'Out of Stock'],
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
          name: 'Low Stock',
          type: 'line',
          data: lowStock,
          smooth: true,
          itemStyle: {
            color: '#f59e0b',
            borderColor: '#d97706',
            borderWidth: 2
          },
          areaStyle: {
            color: 'rgba(245, 158, 11, 0.1)'
          }
        },
        {
          name: 'Out of Stock',
          type: 'line',
          data: outOfStock,
          smooth: true,
          itemStyle: {
            color: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 2
          },
          areaStyle: {
            color: 'rgba(239, 68, 68, 0.1)'
          }
        }
      ]
    };
  }
}
