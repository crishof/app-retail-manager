import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InventoryService, CreateInventorySessionRequest } from '../../../../core/services/inventory.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-session-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
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
                <h1 class="text-3xl font-bold text-slate-900">New Inventory Session</h1>
                <p class="text-slate-500 mt-1">Create a new periodic inventory count</p>
              </div>
            </div>
            <button
              (click)="submitForm()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              [disabled]="isLoading()"
            >
              {{ isLoading() ? 'Creating...' : 'Create Session' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-5xl mx-auto px-6 py-6">
        <form [formGroup]="form">
          <!-- Basic Info -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-slate-900 mb-4">Session Details</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-600 font-medium mb-1">Description *</label>
                <input
                  type="text"
                  formControlName="description"
                  placeholder="e.g., Monthly Inventory Count - June 2026"
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
                <label class="block text-sm text-slate-600 font-medium mb-1">Deposit ID *</label>
                <input
                  type="text"
                  formControlName="depositId"
                  placeholder="Enter deposit ID"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Info Box -->
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-900">
                <strong>Note:</strong> This session will be created in DRAFT status. You'll be able to add inventory items after creating the session, and then start the actual count process.
              </p>
            </div>
          </div>

          <!-- Zone Information -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-slate-900 mb-4">Zone Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 class="font-bold text-slate-900">Zona A (Primary)</h3>
                <p class="text-sm text-slate-600 mt-2">Main storage area for active inventory</p>
              </div>
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 class="font-bold text-slate-900">Zona B (Secondary)</h3>
                <p class="text-sm text-slate-600 mt-2">Secondary storage or overflow area</p>
              </div>
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 class="font-bold text-slate-900">Zona C (Tertiary)</h3>
                <p class="text-sm text-slate-600 mt-2">Additional storage or specialized area</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 mt-4">
              During the count, you'll enter the physical quantity found in each zone for every product.
            </p>
          </div>

          <!-- Workflow Information -->
          <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-slate-900 mb-4">Inventory Workflow</h2>
            <div class="space-y-4">
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold">1</div>
                </div>
                <div>
                  <p class="font-medium text-slate-900">DRAFT</p>
                  <p class="text-sm text-slate-600">Create session and add inventory items</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold">2</div>
                </div>
                <div>
                  <p class="font-medium text-slate-900">IN_PROGRESS</p>
                  <p class="text-sm text-slate-600">Start counting and enter physical quantities</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold">3</div>
                </div>
                <div>
                  <p class="font-medium text-slate-900">COMPLETED</p>
                  <p class="text-sm text-slate-600">Finish counting, review discrepancies</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold">4</div>
                </div>
                <div>
                  <p class="font-medium text-slate-900">CONFIRMED</p>
                  <p class="text-sm text-slate-600">Confirm and finalize the inventory</p>
                </div>
              </div>
            </div>
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
              {{ isLoading() ? 'Creating...' : 'Create Session' }}
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
export class InventorySessionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isLoading = signal(false);

  constructor() {
    this.form = this.fb.group({
      branchId: ['', Validators.required],
      depositId: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialize form with defaults if needed
  }

  submitForm() {
    if (!this.form.valid) {
      console.error('Form is invalid');
      return;
    }

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    const request: CreateInventorySessionRequest = this.form.getRawValue();

    this.isLoading.set(true);
    this.inventoryService
      .createSession(request, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (session) => {
          // Navigate to the detail page to add items
          this.router.navigate([session.id], { relativeTo: this.route.parent });
        },
        error: () => console.error('Failed to create session')
      });
  }
}
