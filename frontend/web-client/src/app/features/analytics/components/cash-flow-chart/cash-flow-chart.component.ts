import { Component, input, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EchartsContainerComponent } from '../echarts-container/echarts-container.component';
import { AnalyticsDataService, CashFlowData } from '../../../../core/services/analytics-data.service';
import { signal } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-cash-flow-chart',
  standalone: true,
  imports: [CommonModule, EchartsContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Cash Flow</h3>
        <p class="text-sm text-gray-500">Daily inflow and outflow</p>
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
export class CashFlowChartComponent {
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
    this.analyticsService.getCashFlow(startDate, endDate).subscribe({
      next: (data) => {
        this.chartOption.set(this.buildChartOption(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private buildChartOption(data: CashFlowData[]): EChartsOption {
    const dates = data.map(d => d.date);
    const inflow = data.map(d => d.inflow);
    const outflow = data.map(d => d.outflow);

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
            let result = params[0].name + '<br/>';
            params.forEach((p: any) => {
              const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(p.value);
              result += `${p.marker} ${p.name}: ${formatted}<br/>`;
            });
            return result;
          }
          return '';
        }
      },
      legend: {
        top: 0,
        data: ['Inflow', 'Outflow'],
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
          name: 'Inflow',
          type: 'line',
          data: inflow,
          smooth: true,
          itemStyle: {
            color: '#10b981',
            borderColor: '#047857',
            borderWidth: 2
          },
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.1)'
          }
        },
        {
          name: 'Outflow',
          type: 'line',
          data: outflow,
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
