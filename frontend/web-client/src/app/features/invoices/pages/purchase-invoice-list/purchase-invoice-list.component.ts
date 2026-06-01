import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { PurchaseInvoiceService, PurchaseInvoice } from '../../../../core/services/purchase-invoice.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-purchase-invoice-list',
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
              <h1 class="text-3xl font-bold text-slate-900">Purchase Invoices</h1>
              <p class="text-slate-500 mt-1">Manage and track supplier invoices</p>
            </div>
            <button
              routerLink="new"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              + New Invoice
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
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
                placeholder="Search by invoice number or supplier..."
                class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                [value]="statusFilter()"
                (change)="statusFilter.set($any($event.target).value)"
                class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                [value]="paymentStatusFilter()"
                (change)="paymentStatusFilter.set($any($event.target).value)"
                class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
              <select
                [value]="withHoldingFilter()"
                (change)="withHoldingFilter.set($any($event.target).value)"
                class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Invoices</option>
                <option value="true">With Withholding</option>
                <option value="false">Without Withholding</option>
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
              Loading invoices...
            </div>
          </div>
        } @else if (filteredInvoices().length === 0) {
          <div class="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div class="text-4xl mb-3">📋</div>
            <p class="text-slate-600 font-medium">No invoices found</p>
            <p class="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new invoice</p>
          </div>
        } @else {
          <!-- Table -->
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Invoice #</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Supplier Invoice</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Supplier</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Issue Date</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Withholding</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (invoice of filteredInvoices(); track invoice.id) {
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="[invoice.id]"
                          class="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {{ invoice.number }}
                        </a>
                      </td>
                      <td class="px-6 py-4 text-slate-700">{{ invoice.supplierInvoiceNumber }}</td>
                      <td class="px-6 py-4 text-slate-700">{{ invoice.supplierId }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ invoice.issueDate | date: 'short' }}</td>
                      <td class="px-6 py-4 text-right font-medium text-slate-900">
                        {{ invoice.totalPrice | currency }}
                      </td>
                      <td class="px-6 py-4 text-right font-medium" [ngClass]="invoice.retentionAmount > 0 ? 'text-orange-600' : 'text-slate-500'">
                        @if (invoice.retentionAmount > 0) {
                          {{ invoice.retentionAmount | currency }}
                          <span class="text-xs">({{ invoice.retentionPercentage }}%)</span>
                        } @else {
                          —
                        }
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [ngClass]="getStatusBadgeClass(invoice.status)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ invoice.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          [routerLink]="[invoice.id]"
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
               <p class="text-slate-600 text-sm">Total Invoices</p>
               <p class="text-2xl font-bold text-slate-900 mt-1">{{ filteredInvoices().length }}</p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">Total Amount</p>
               <p class="text-2xl font-bold text-slate-900 mt-1">
                 {{ totalAmountFormatted() }}
               </p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">Total Withholding</p>
               <p class="text-2xl font-bold text-orange-600 mt-1">
                 {{ totalWithholdingFormatted() }}
               </p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">Unpaid</p>
               <p class="text-2xl font-bold text-red-600 mt-1">
                 {{ unpaidCount() }}
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
export class PurchaseInvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(PurchaseInvoiceService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  invoices = signal<PurchaseInvoice[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');
  paymentStatusFilter = signal('');
  withHoldingFilter = signal('');

  filteredInvoices = computed(() => {
    const invoices = this.invoices();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const paymentStatus = this.paymentStatusFilter();
    const withHolding = this.withHoldingFilter();

    return invoices.filter(inv =>
      (inv.number.toLowerCase().includes(search) || 
       inv.supplierInvoiceNumber.toLowerCase().includes(search) ||
       inv.supplierId.toLowerCase().includes(search)) &&
      (!status || inv.status === status) &&
      (!paymentStatus || inv.paymentStatus === paymentStatus) &&
      (!withHolding || (withHolding === 'true' ? inv.retentionAmount > 0 : inv.retentionAmount === 0))
    );
  });

  totalAmountFormatted = computed(() => {
    const total = this.filteredInvoices().reduce((sum, inv) => sum + inv.totalPrice, 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  });

  totalWithholdingFormatted = computed(() => {
    const total = this.filteredInvoices().reduce((sum, inv) => sum + inv.retentionAmount, 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  });

  unpaidCount = computed(() => {
    return this.filteredInvoices().filter(inv => inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'PARTIAL').length;
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
