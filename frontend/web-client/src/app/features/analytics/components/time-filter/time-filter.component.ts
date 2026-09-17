import { Component, output, ChangeDetectionStrategy, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

@Component({
  selector: 'app-time-filter',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <!-- Preset buttons -->
      <div class="flex flex-wrap gap-2">
        @for (preset of presets; track preset) {
          <button
            (click)="selectPreset(preset)"
            [class.bg-blue-600]="isPresetSelected(preset)"
            [class.text-white]="isPresetSelected(preset)"
            [class.bg-gray-100]="!isPresetSelected(preset)"
            [class.text-gray-700]="!isPresetSelected(preset)"
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-80"
            >
            {{ preset.label }}
          </button>
        }
      </div>
    
      <!-- Custom date range -->
      <div class="flex flex-col md:flex-row gap-2 md:ml-auto">
        <div>
          <label class="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            [(ngModel)]="customStartDate"
            (change)="onCustomDateChange()"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            [(ngModel)]="customEndDate"
            (change)="onCustomDateChange()"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <button
          (click)="applyCustomRange()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors self-end"
          >
          Apply
        </button>
      </div>
    </div>
    `
})
export class TimeFilterComponent {
  private fb = inject(FormBuilder);

  dateRangeSelected = output<DateRange>();

  presets: DateRange[] = [];
  selectedPreset: DateRange | null = null;
  customStartDate: string = '';
  customEndDate: string = '';

  constructor() {
    this.initializePresets();
  }

  private initializePresets(): void {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    this.presets = [
      {
        startDate: this.formatDate(oneWeekAgo),
        endDate: this.formatDate(today),
        label: 'Last 7 Days'
      },
      {
        startDate: this.formatDate(thirtyDaysAgo),
        endDate: this.formatDate(today),
        label: 'Last 30 Days'
      },
      {
        startDate: this.formatDate(ninetyDaysAgo),
        endDate: this.formatDate(today),
        label: 'Last 90 Days'
      },
      {
        startDate: this.formatDate(oneYearAgo),
        endDate: this.formatDate(today),
        label: 'Last Year'
      }
    ];

    // Select last 30 days by default
    const defaultPreset = this.presets[1];
    this.selectPreset(defaultPreset);
  }

  selectPreset(preset: DateRange): void {
    this.selectedPreset = preset;
    this.customStartDate = preset.startDate;
    this.customEndDate = preset.endDate;
    this.dateRangeSelected.emit(preset);
  }

  isPresetSelected(preset: DateRange): boolean {
    return this.selectedPreset === preset;
  }

  onCustomDateChange(): void {
    this.selectedPreset = null;
  }

  applyCustomRange(): void {
    if (this.customStartDate && this.customEndDate) {
      const range: DateRange = {
        startDate: this.customStartDate,
        endDate: this.customEndDate,
        label: 'Custom'
      };
      this.dateRangeSelected.emit(range);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
