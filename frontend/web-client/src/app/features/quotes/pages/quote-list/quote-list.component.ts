import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { QuoteService, Quote } from '../../../../core/services/quote.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">Quotations</h1>
              <p class="text-slate-500 mt-1">Manage customer quotations</p>
            </div>
            <button
              routerLink="new"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              + New Quotation
            </button>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              [(ngModel)]="searchTerm()"
              placeholder="Search by quotation number or customer..."
              class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              [(ngModel)]="statusFilter()"
              class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CONVERTED_TO_SALE">Converted</option>
            </select>
            <select
              [(ngModel)]="dateFilter()"
              class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Quotes</option>
              <option value="active">Active (Not Expired)</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-6 pb-6">
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="text-slate-500">
              <div class="animate-spin text-2xl mb-2">⏳</div>
              Loading quotations...
            </div>
          </div>
        } @else if (filteredQuotes().length === 0) {
          <div class="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div class="text-4xl mb-3">📋</div>
            <p class="text-slate-600 font-medium">No quotations found</p>
            <p class="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new quotation</p>
          </div>
        } @else {
          <!-- Table -->
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Quote #</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Issue Date</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Expires</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (quote of filteredQuotes(); track quote.id) {
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="[quote.id]"
                          class="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {{ quote.number }}
                        </a>
                      </td>
                      <td class="px-6 py-4 text-slate-700">{{ quote.customerId }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ quote.issueDate | date: 'short' }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ quote.expirationDate | date: 'short' }}</td>
                      <td class="px-6 py-4 text-right font-medium text-slate-900">
                        {{ quote.totalPrice | currency }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [ngClass]="getStatusBadgeClass(quote.status)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ quote.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          [routerLink]="[quote.id]"
                          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Total Quotations</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">{{ filteredQuotes().length }}</p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Total Value</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">
                {{ getTotalValue() | currency }}
              </p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Active</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">
                {{ getActiveCount() }}
              </p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Converted to Sale</p>
              <p class="text-2xl font-bold text-green-600 mt-1">
                {{ getConvertedCount() }}
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class QuoteListComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  quotes = signal<Quote[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');
  dateFilter = signal('');

  filteredQuotes = computed(() => {
    const quotes = this.quotes();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const dateFilter = this.dateFilter();

    return quotes.filter(quote =>
      (quote.number.toLowerCase().includes(search) || 
       quote.customerId.toLowerCase().includes(search)) &&
      (!status || quote.status === status) &&
      (!dateFilter || this.matchesDateFilter(quote, dateFilter))
    );
  });

  ngOnInit() {
    this.loadQuotes();
  }

  private loadQuotes() {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.quoteService
      .getAll(tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load quotes');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(quotes => this.quotes.set(quotes));
  }

  private matchesDateFilter(quote: Quote, filter: string): boolean {
    const today = new Date();
    const expirationDate = new Date(quote.expirationDate);

    if (filter === 'active') {
      return expirationDate > today && quote.status !== 'CONVERTED_TO_SALE';
    } else if (filter === 'expired') {
      return expirationDate <= today && quote.status !== 'CONVERTED_TO_SALE';
    }
    return true;
  }

  getTotalValue(): number {
    return this.filteredQuotes().reduce((sum, quote) => sum + quote.totalPrice, 0);
  }

  getActiveCount(): number {
    const today = new Date();
    return this.filteredQuotes().filter(quote => {
      const expDate = new Date(quote.expirationDate);
      return expDate > today && quote.status !== 'CONVERTED_TO_SALE';
    }).length;
  }

  getConvertedCount(): number {
    return this.filteredQuotes().filter(quote => quote.status === 'CONVERTED_TO_SALE').length;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-700',
      'SENT': 'bg-blue-100 text-blue-700',
      'ACCEPTED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'EXPIRED': 'bg-orange-100 text-orange-700',
      'CONVERTED_TO_SALE': 'bg-purple-100 text-purple-700'
    };
    return classMap[status] || 'bg-slate-100 text-slate-700';
  }
}
