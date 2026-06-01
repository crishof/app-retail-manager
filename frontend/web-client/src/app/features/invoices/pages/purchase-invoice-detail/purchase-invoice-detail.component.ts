import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PurchaseInvoiceService, PurchaseInvoice } from '../../../../core/services/purchase-invoice.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-purchase-invoice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-5xl mx-auto px-6 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                routerLink="../"
                class="text-slate-500 hover:text-slate-700 text-lg"
              >
                ←
              </button>
              <div>
                <h1 class="text-3xl font-bold text-slate-900">{{ invoice()?.number }}</h1>
                <p class="text-slate-500 mt-1">Supplier Invoice: {{ invoice()?.supplierInvoiceNumber }}</p>
              </div>
            </div>
            @if (invoice()) {
              <div class="flex gap-2">
                <button
                  (click)="editRetention()"
                  class="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                  [disabled]="isLoading()"
                >
                  Edit Retention
                </button>
                @if (invoice()?.status === 'DRAFT') {
                  <button
                    (click)="deleteInvoice()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    [disabled]="isLoading()"
                  >
                    Delete
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-5xl mx-auto px-6 py-6">
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="text-slate-500">
              <div class="animate-spin text-2xl mb-2">⏳</div>
              Loading invoice...
            </div>
          </div>
        } @else if (invoice()) {
          <div class="grid gap-6">
            <!-- Main Info -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p class="text-sm text-slate-600 font-medium">Issue Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ invoice()?.issueDate | date: 'medium' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Due Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ invoice()?.dueDate | date: 'medium' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Status</p>
                  <span
                    [ngClass]="getStatusBadgeClass(invoice()!.status)"
                    class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1"
                  >
                    {{ invoice()?.status }}
                  </span>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Payment Status</p>
                  <span
                    [ngClass]="getPaymentStatusBadgeClass(invoice()!.paymentStatus)"
                    class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1"
                  >
                    {{ invoice()?.paymentStatus }}
                  </span>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Supplier ID</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ invoice()?.supplierId }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Branch ID</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ invoice()?.branchId }}</p>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <h2 class="text-xl font-bold text-slate-900 mb-4">Line Items</h2>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700">Description</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Quantity</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Unit Price</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Discount</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Tax Rate</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of invoice()?.items; track item.id) {
                      <tr class="border-b border-slate-200 hover:bg-slate-50">
                        <td class="px-4 py-3 text-slate-900">{{ item.description }}</td>
                        <td class="px-4 py-3 text-right text-slate-700">{{ item.quantity }}</td>
                        <td class="px-4 py-3 text-right text-slate-700">{{ item.unitPrice | currency }}</td>
                        <td class="px-4 py-3 text-right text-slate-700">{{ item.discountPercentage }}%</td>
                        <td class="px-4 py-3 text-right text-slate-700">{{ item.taxRate }}</td>
                        <td class="px-4 py-3 text-right font-medium text-slate-900">{{ item.lineTotalWithTax | currency }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Totals & Withholding -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border-t border-slate-200 pt-4">
                  <p class="text-sm text-slate-600 font-medium">Subtotal</p>
                  <p class="text-2xl font-bold text-slate-900 mt-2">{{ (invoice()!.totalPrice - (invoice()?.retentionAmount || 0)) | currency }}</p>
                </div>
                <div class="border-t border-orange-200 pt-4">
                  <p class="text-sm text-orange-600 font-medium">Withholding ({{ invoice()?.retentionPercentage }}%)</p>
                  <p class="text-2xl font-bold text-orange-600 mt-2">{{ invoice()?.retentionAmount | currency }}</p>
                </div>
                <div class="border-t border-slate-900 pt-4">
                  <p class="text-sm text-slate-900 font-bold">Total Amount</p>
                  <p class="text-2xl font-bold text-slate-900 mt-2">{{ invoice()?.totalPrice | currency }}</p>
                </div>
              </div>
            </div>

            <!-- Payment Info -->
            @if (invoice()?.paymentStatus !== 'PAID') {
              <div class="bg-white rounded-lg border border-slate-200 p-6">
                <h2 class="text-xl font-bold text-slate-900 mb-4">Payment Information</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p class="text-sm text-slate-600 font-medium">Amount Paid</p>
                    <p class="text-2xl font-bold text-green-600 mt-1">{{ invoice()?.amountPaid | currency }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600 font-medium">Remaining</p>
                    <p class="text-2xl font-bold text-red-600 mt-1">{{ invoice()?.remainingAmount | currency }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600 font-medium">Payment Method</p>
                    <p class="text-lg font-semibold text-slate-900 mt-1">{{ invoice()?.paymentMethod || 'Not specified' }}</p>
                  </div>
                </div>
              </div>
            }

            <!-- Observations -->
            @if (invoice()?.observations) {
              <div class="bg-white rounded-lg border border-slate-200 p-6">
                <h2 class="text-xl font-bold text-slate-900 mb-4">Observations</h2>
                <p class="text-slate-700 whitespace-pre-wrap">{{ invoice()?.observations }}</p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Retention Modal -->
      @if (showRetentionModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 class="text-2xl font-bold text-slate-900 mb-4">Edit Retention</h2>
             <div class="mb-4">
               <label class="block text-sm text-slate-600 font-medium mb-2">Retention Percentage (%)</label>
               <input
                 type="number"
                 [value]="newRetentionPercentage()"
                 (input)="newRetentionPercentage.set(+($any($event.target).value))"
                 min="0"
                 max="100"
                 step="0.01"
                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
               />
             </div>
            <div class="flex gap-3">
              <button
                (click)="saveRetention()"
                class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                [disabled]="isLoading()"
              >
                Save
              </button>
              <button
                (click)="closeRetentionModal()"
                class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                [disabled]="isLoading()"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PurchaseInvoiceDetailComponent implements OnInit {
  private readonly invoiceService = inject(PurchaseInvoiceService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  invoice = signal<PurchaseInvoice | null>(null);
  isLoading = signal(false);
  showRetentionModal = signal(false);
  newRetentionPercentage = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(id);
    }
  }

  private loadInvoice(id: string) {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.invoiceService
      .getById(id, tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load invoice');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(invoice => {
        this.invoice.set(invoice);
        if (invoice) {
          this.newRetentionPercentage.set(invoice.retentionPercentage);
        }
      });
  }

  editRetention() {
    this.showRetentionModal.set(true);
  }

  closeRetentionModal() {
    this.showRetentionModal.set(false);
  }

  saveRetention() {
    const invoice = this.invoice();
    if (!invoice) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.invoiceService
      .updateRetention(invoice.id!, this.newRetentionPercentage(), tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.showRetentionModal.set(false);
        },
        error: () => console.error('Failed to update retention')
      });
  }

  deleteInvoice() {
    const invoice = this.invoice();
    if (!invoice || !confirm('Are you sure you want to delete this invoice?')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.invoiceService
      .delete(invoice.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['../'], { relativeTo: this.route }),
        error: () => console.error('Failed to delete invoice')
      });
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

  getPaymentStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'PENDING': 'bg-red-100 text-red-700',
      'PARTIAL': 'bg-yellow-100 text-yellow-700',
      'PAID': 'bg-green-100 text-green-700'
    };
    return classMap[status] || 'bg-slate-100 text-slate-700';
  }
}
