import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { QuoteService, Quote } from '../../../../core/services/quote.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-quote-detail',
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
                <h1 class="text-3xl font-bold text-slate-900">{{ quote()?.number }}</h1>
                <p class="text-slate-500 mt-1">Customer: {{ quote()?.customerId }}</p>
              </div>
            </div>
            @if (quote()) {
              <div class="flex gap-2">
                @if (quote()?.status === 'DRAFT' || quote()?.status === 'SENT') {
                  <button
                    (click)="convertToSale()"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    [disabled]="isLoading()"
                  >
                    Convert to Sale
                  </button>
                }
                @if (quote()?.status === 'DRAFT' || quote()?.status === 'SENT') {
                  <button
                    (click)="rejectQuote()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    [disabled]="isLoading()"
                  >
                    Reject
                  </button>
                }
                @if (quote()?.status === 'DRAFT') {
                  <button
                    (click)="deleteQuote()"
                    class="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition"
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
              Loading quotation...
            </div>
          </div>
        } @else if (quote()) {
          <div class="grid gap-6">
            <!-- Main Info -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p class="text-sm text-slate-600 font-medium">Issue Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ quote()?.issueDate | date: 'medium' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Expiration Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ quote()?.expirationDate | date: 'medium' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Status</p>
                  <span
                    [ngClass]="getStatusBadgeClass(quote()!.status)"
                    class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1"
                  >
                    {{ quote()?.status }}
                  </span>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Customer ID</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ quote()?.customerId }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Branch ID</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ quote()?.branchId }}</p>
                </div>
                @if (quote()?.saleId) {
                  <div>
                    <p class="text-sm text-slate-600 font-medium">Converted to Sale</p>
                    <p class="text-lg font-semibold text-green-600 mt-1">{{ quote()?.saleId }}</p>
                  </div>
                }
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
                    @for (item of quote()?.items; track item.id) {
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

            <!-- Totals -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="flex justify-end">
                <div class="w-full md:w-1/3">
                  <div class="flex justify-between font-bold text-xl border-t border-slate-900 pt-4">
                    <span>Total Amount</span>
                    <span>{{ quote()?.totalPrice | currency }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Observations -->
            @if (quote()?.observations) {
              <div class="bg-white rounded-lg border border-slate-200 p-6">
                <h2 class="text-xl font-bold text-slate-900 mb-4">Observations</h2>
                <p class="text-slate-700 whitespace-pre-wrap">{{ quote()?.observations }}</p>
              </div>
            }
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
export class QuoteDetailComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  quote = signal<Quote | null>(null);
  isLoading = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadQuote(id);
    }
  }

  private loadQuote(id: string) {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.quoteService
      .getById(id, tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load quote');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(quote => this.quote.set(quote));
  }

  convertToSale() {
    const quote = this.quote();
    if (!quote || !confirm('Convert this quotation to a sale?')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.quoteService
      .convertToSale(quote.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.quote.set(updated);
          alert('Quotation converted to sale successfully!');
        },
        error: () => console.error('Failed to convert quote to sale')
      });
  }

  rejectQuote() {
    const quote = this.quote();
    if (!quote || !confirm('Reject this quotation? This action cannot be undone.')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.quoteService
      .reject(quote.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.quote.set(updated);
        },
        error: () => console.error('Failed to reject quote')
      });
  }

  deleteQuote() {
    const quote = this.quote();
    if (!quote || !confirm('Are you sure you want to delete this quotation?')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.quoteService
      .delete(quote.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['../'], { relativeTo: this.route }),
        error: () => console.error('Failed to delete quote')
      });
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
