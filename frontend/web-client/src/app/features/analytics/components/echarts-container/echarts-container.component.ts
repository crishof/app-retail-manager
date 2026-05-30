import { Component, ViewChild, ElementRef, effect, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';

@Component({
  selector: 'app-echarts-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #chartContainer
      class="w-full h-full"
      style="min-height: 300px;"
    ></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class EchartsContainerComponent {
  @ViewChild('chartContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  option = input<echarts.EChartsOption>();
  theme = input<string>('light');

  private chart: echarts.ECharts | null = null;

  constructor() {
    effect(() => {
      const opt = this.option();
      if (opt) {
        this.updateChart(opt);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  private initChart(): void {
    const container = this.containerRef.nativeElement;
    this.chart = echarts.init(container, this.theme());
    
    window.addEventListener('resize', () => {
      this.chart?.resize();
    });
  }

  private updateChart(option: echarts.EChartsOption): void {
    if (!this.chart) {
      this.initChart();
    }
    this.chart?.setOption(option, true);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    window.removeEventListener('resize', () => {
      this.chart?.resize();
    });
  }
}
