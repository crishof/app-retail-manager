import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SalesInvoiceService, SalesInvoice } from '../../../../core/services/sales-invoice.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-sales-invoice-accessible',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Skip to main content link (WCAG 2.4.1) -->
      <a href="#main-content" class="visually-hidden focus:visually-hidden-reset">
        Skip to main content
      </a>

      <!-- Header with semantic role (WCAG 1.3.1) -->
      <header class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">Sales Invoices</h1>
              <p class="text-slate-500 mt-1">Manage and track customer invoices</p>
            </div>
            <button
              routerLink="new"
              aria-label="Create a new sales invoice"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
            >
              <span aria-hidden="true">+</span> New Invoice
            </button>
          </div>
        </div>
      </header>

      <!-- Main content area (WCAG 1.3.1) -->
      <main id="main-content" class="max-w-7xl mx-auto px-6 py-6">
        <!-- Filters section with fieldset (WCAG 3.3.2) -->
        <fieldset class="bg-white rounded-lg border border-slate-200 p-4">
          <legend class="font-bold text-slate-900 mb-4">Filter Invoices</legend>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="search-invoice" class="block text-sm font-medium text-slate-700 mb-1">
                Search by invoice number or customer
              </label>
              <input
                id="search-invoice"
                type="text"
                [(ngModel)]="searchTerm()"
                placeholder="e.g., INV-001 or Acme Corp"
                aria-describedby="search-help"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p id="search-help" class="text-xs text-slate-500 mt-1">
                Search is case-insensitive. Partial matches are supported.
              </p>
            </div>

            <div>
              <label for="status-filter" class="block text-sm font-medium text-slate-700 mb-1">
                Invoice Status
              </label>
              <select
                id="status-filter"
                [(ngModel)]="statusFilter()"
                aria-label="Filter invoices by status"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label for="payment-filter" class="block text-sm font-medium text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                id="payment-filter"
                [(ngModel)]="paymentStatusFilter()"
                aria-label="Filter invoices by payment status"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </fieldset>

        <!-- Loading state with accessible live region (WCAG 4.1.3) -->
        @if (isLoading()) {
          <div 
            class="flex justify-center py-12"
            role="status"
            aria-live="polite"
            aria-label="Loading invoices"
          >
            <div class="text-slate-500">
              <div class="animate-spin text-2xl mb-2" aria-hidden="true">⏳</div>
              <p>Loading invoices...</p>
            </div>
          </div>
        } @else if (filteredInvoices().length === 0) {
          <div class="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div class="text-4xl mb-3" aria-hidden="true">📄</div>
            <p class="text-slate-600 font-medium">No invoices found</p>
            <p class="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new invoice</p>
          </div>
        } @else {
          <!-- Table with proper semantic markup (WCAG 1.3.1, 2.4.3) -->
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <caption class="visually-hidden">
                  List of sales invoices showing invoice number, customer, date, amount, and status
                </caption>
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Invoice #
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Customer
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Issue Date
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">
                      Amount
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (invoice of filteredInvoices(); track invoice.id) {
                    <tr class="border-b border-slate-200 hover:bg-slate-50 focus-within:bg-primary-50 transition">
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="[invoice.id]"
                          class="font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
                          [attr.aria-label]="'View invoice ' + invoice.number"
                        >
                          {{ invoice.number }}
                        </a>
                      </td>
                      <td class="px-6 py-4 text-slate-700">{{ invoice.customerId }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ invoice.issueDate | date: 'short' }}</td>
                      <td class="px-6 py-4 text-right font-medium text-slate-900">
                        {{ invoice.totalPrice | currency }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [ngClass]="getStatusBadgeClass(invoice.status)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                          role="status"
                          [attr.aria-label]="'Invoice status: ' + invoice.status"
                        >
                          {{ invoice.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          [routerLink]="[invoice.id]"
                          aria-label="View details for invoice {{ invoice.number }}"
                          class="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2"
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

          <!-- Summary stats with accessible heading (WCAG 2.4.2) -->
          <h2 class="text-xl font-bold text-slate-900 mt-6 mb-4">Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg border border-slate-200 p-4" aria-live="polite">
              <p class="text-slate-600 text-sm">Total Invoices</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">{{ filteredInvoices().length }}</p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Total Amount</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">
                {{ (filteredInvoices() | totalAmount) | currency }}
              </p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Unpaid</p>
              <p class="text-2xl font-bold text-red-600 mt-1">
                {{ (filteredInvoices() | filterByPaymentStatus: 'PENDING' | length) }}
              </p>
            </div>
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <p class="text-slate-600 text-sm">Paid</p>
              <p class="text-2xl font-bold text-green-600 mt-1">
                {{ (filteredInvoices() | filterByPaymentStatus: 'PAID' | length) }}
              </p>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Visually hidden but accessible to screen readers (WCAG 1.3.1) */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .visually-hidden:focus,
    .focus\\:visually-hidden-reset:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }

    /* High contrast focus visible (WCAG 2.4.7) */
    :focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    /* Reduced motion support (WCAG 2.3.3) */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* High contrast mode support (WCAG 1.4.11) */
    @media (prefers-contrast: more) {
      button {
        border: 2px solid currentColor;
      }
    }
  `]
})
export class SalesInvoiceAccessibleComponent implements OnInit {
  private readonly invoiceService = inject(SalesInvoiceService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  invoices = signal<SalesInvoice[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');
  paymentStatusFilter = signal('');

  filteredInvoices = computed(() => {
    const invoices = this.invoices();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const paymentStatus = this.paymentStatusFilter();

    return invoices.filter(inv =>
      (inv.number.toLowerCase().includes(search) || inv.customerId.toLowerCase().includes(search)) &&
      (!status || inv.status === status) &&
      (!paymentStatus || inv.paymentStatus === paymentStatus)
    );
  });

  ngOnInit() {
    this.loadInvoices();
  }

  private loadInvoices() {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.invoiceService
      .getAll(tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load invoices');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(invoices => this.invoices.set(invoices));
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-700',
      'ISSUED': 'bg-blue-100 text-blue-700',
      'PAID': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return classMap[status] || 'bg-slate-100 text-slate-700';
  }
}
