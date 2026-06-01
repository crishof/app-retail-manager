import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PurchaseInvoiceService, CreatePurchaseInvoiceRequest, PurchaseInvoiceItem } from '../../../../core/services/purchase-invoice.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-purchase-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
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
                <h1 class="text-3xl font-bold text-slate-900">New Purchase Invoice</h1>
                <p class="text-slate-500 mt-1">Create a new supplier invoice</p>
              </div>
            </div>
            <button
              (click)="submitForm()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              [disabled]="isLoading()"
            >
              {{ isLoading() ? 'Saving...' : 'Save Invoice' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-5xl mx-auto px-6 py-6">
        <form [formGroup]="form">
          <!-- Basic Info -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-slate-900 mb-4">Invoice Details</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Supplier ID *</label>
                <input
                  type="text"
                  formControlName="supplierId"
                  placeholder="Enter supplier ID"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  formControlName="number"
                  placeholder="e.g., Q001/2026"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Supplier Invoice Number *</label>
                <input
                  type="text"
                  formControlName="supplierInvoiceNumber"
                  placeholder="Supplier's invoice number"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Document Type *</label>
                <select
                  formControlName="documentType"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="FACTURA">Invoice (FACTURA)</option>
                  <option value="NOTA_CREDITO">Credit Note (NC)</option>
                  <option value="NOTA_DEBITO">Debit Note (ND)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Issue Date *</label>
                <input
                  type="date"
                  formControlName="issueDate"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Due Date *</label>
                <input
                  type="date"
                  formControlName="dueDate"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Branch ID *</label>
                <input
                  type="text"
                  formControlName="branchId"
                  placeholder="Enter branch ID"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Location ID</label>
                <input
                  type="text"
                  formControlName="locationId"
                  placeholder="Optional location ID"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Retention Percentage (%)</label>
                <input
                  type="number"
                  formControlName="retentionPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Payment Method</label>
                <input
                  type="text"
                  formControlName="paymentMethod"
                  placeholder="e.g., Bank Transfer, Cash"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm text-slate-600 font-medium mb-1 mt-4">Observations</label>
              <textarea
                formControlName="observations"
                rows="3"
                placeholder="Additional notes..."
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          <!-- Line Items -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-slate-900">Line Items</h2>
              <button
                type="button"
                (click)="addLineItem()"
                class="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >
                + Add Item
              </button>
            </div>

            @if (items().length === 0) {
              <p class="text-slate-500 text-center py-8">No items added yet. Click "Add Item" to begin.</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700">Description</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Quantity</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Unit Price</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Discount %</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Tax Rate</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Line Total</th>
                      <th class="px-4 py-3 text-center text-xs font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of items(); let i = $index; track i) {
                      <tr class="border-b border-slate-200">
                        <td class="px-4 py-3">
                          <input
                            type="text"
                            [(ngModel)]="item.description"
                            [ngModelOptions]="{updateOn: 'blur'}"
                            placeholder="Description"
                            class="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <input
                            type="number"
                            [(ngModel)]="item.quantity"
                            [ngModelOptions]="{updateOn: 'blur'}"
                            min="0"
                            step="1"
                            class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <input
                            type="number"
                            [(ngModel)]="item.unitPrice"
                            [ngModelOptions]="{updateOn: 'blur'}"
                            min="0"
                            step="0.01"
                            class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <input
                            type="number"
                            [(ngModel)]="item.discountPercentage"
                            [ngModelOptions]="{updateOn: 'blur'}"
                            min="0"
                            max="100"
                            step="0.01"
                            class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <select
                            [(ngModel)]="item.taxRate"
                            [ngModelOptions]="{updateOn: 'blur'}"
                            class="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0%">0% (Exempt)</option>
                            <option value="7%">7% (Reduced)</option>
                            <option value="21%">21% (Standard)</option>
                          </select>
                        </td>
                        <td class="px-4 py-3 text-right font-medium text-slate-900">
                          {{ calculateLineTotal(item) | currency }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <button
                            type="button"
                            (click)="removeLineItem(i)"
                            class="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Total -->
              <div class="mt-6 flex justify-end">
                <div class="w-full md:w-1/3">
                  <div class="flex justify-between mb-2 pb-2 border-b border-slate-200">
                    <span class="text-slate-600">Subtotal:</span>
                    <span class="font-medium">{{ getTotalSubtotal() | currency }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{{ getTotalPrice() | currency }}</span>
                  </div>
                  <input
                    type="hidden"
                    formControlName="totalPrice"
                    [value]="getTotalPrice()"
                  />
                </div>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              routerLink="../"
              class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitForm()"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              [disabled]="isLoading() || !form.valid"
            >
              {{ isLoading() ? 'Saving...' : 'Save Invoice' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PurchaseInvoiceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(PurchaseInvoiceService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isLoading = signal(false);
  items = signal<PurchaseInvoiceItem[]>([]);

  constructor() {
    this.form = this.fb.group({
      supplierId: ['', Validators.required],
      branchId: ['', Validators.required],
      locationId: [''],
      number: ['', Validators.required],
      supplierInvoiceNumber: ['', Validators.required],
      documentType: ['FACTURA', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      totalPrice: [{ value: 0, disabled: true }],
      retentionPercentage: [0],
      paymentMethod: [''],
      observations: ['']
    });
  }

  ngOnInit() {
    // Initialize with one empty line item
    this.addLineItem();
  }

  addLineItem() {
    const newItem: PurchaseInvoiceItem = {
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercentage: 0,
      taxRate: '21%'
    };
    this.items.update(items => [...items, newItem]);
  }

  removeLineItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  calculateLineTotal(item: PurchaseInvoiceItem): number {
    const subtotal = item.quantity * item.unitPrice;
    const discounted = subtotal * (1 - item.discountPercentage / 100);
    const taxRate = parseFloat(item.taxRate) / 100;
    return discounted * (1 + taxRate);
  }

  getTotalSubtotal(): number {
    return this.items().reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + subtotal * (1 - item.discountPercentage / 100);
    }, 0);
  }

  getTotalPrice(): number {
    return this.items().reduce((sum, item) => sum + this.calculateLineTotal(item), 0);
  }

  submitForm() {
    if (!this.form.valid || this.items().length === 0) {
      console.error('Form is invalid or no items added');
      return;
    }

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    const request: CreatePurchaseInvoiceRequest = {
      ...this.form.getRawValue(),
      totalPrice: this.getTotalPrice(),
      items: this.items()
    };

    this.isLoading.set(true);
    this.invoiceService
      .create(request, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['../'], { relativeTo: this.route }),
        error: () => console.error('Failed to create invoice')
      });
  }
}
