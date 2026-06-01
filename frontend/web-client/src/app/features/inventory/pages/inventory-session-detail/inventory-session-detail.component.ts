import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { InventoryService, InventorySession, InventoryItem } from '../../../../core/services/inventory.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-inventory-session-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                routerLink="../"
                class="text-slate-500 hover:text-slate-700 text-lg"
              >
                ←
              </button>
              <div>
                <h1 class="text-3xl font-bold text-slate-900">{{ session()?.description }}</h1>
                <p class="text-slate-500 mt-1">Branch: {{ session()?.branchId }} | Deposit: {{ session()?.depositId }}</p>
              </div>
            </div>
            @if (session()) {
              <div class="flex gap-2">
                @if (session()?.status === 'DRAFT') {
                  <button
                    (click)="startCounting()"
                    class="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                    [disabled]="isLoading()"
                  >
                    Start Counting
                  </button>
                }
                @if (session()?.status === 'IN_PROGRESS') {
                  <button
                    (click)="completeCount()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    [disabled]="isLoading()"
                  >
                    Complete Count
                  </button>
                }
                @if (session()?.status === 'COMPLETED') {
                  <button
                    (click)="confirmSession()"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    [disabled]="isLoading()"
                  >
                    Confirm
                  </button>
                }
                @if (session()?.status === 'DRAFT') {
                  <button
                    (click)="deleteSession()"
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
      <div class="max-w-7xl mx-auto px-6 py-6">
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="text-slate-500">
              <div class="animate-spin text-2xl mb-2">⏳</div>
              Loading session...
            </div>
          </div>
        } @else if (session()) {
          <div class="grid gap-6">
            <!-- Session Info -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p class="text-sm text-slate-600 font-medium">Status</p>
                  <span
                    [ngClass]="getStatusBadgeClass(session()!.status)"
                    class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1"
                  >
                    {{ session()?.status }}
                  </span>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">Start Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ session()?.startDate | date: 'medium' || 'Not started' }}</p>
                </div>
                <div>
                  <p class="text-sm text-slate-600 font-medium">End Date</p>
                  <p class="text-lg font-semibold text-slate-900 mt-1">{{ session()?.endDate | date: 'medium' || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <div class="bg-white rounded-lg border border-slate-200 p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-900">Inventory Items</h2>
                @if (session()?.status === 'DRAFT' || session()?.status === 'IN_PROGRESS') {
                  <button
                    (click)="addItem()"
                    class="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    + Add Item
                  </button>
                }
              </div>

              @if (!session()?.items || session()!.items.length === 0) {
                <p class="text-slate-500 text-center py-8">No items in this session yet.</p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-slate-200">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700">Product ID</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700">Description</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Expected</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Zona A</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Zona B</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Zona C</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Total</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700">Disc.</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of session()?.items; track item.id) {
                        <tr class="border-b border-slate-200 hover:bg-slate-50" [ngClass]="item.discrepancy !== 0 ? 'bg-yellow-50' : ''">
                          <td class="px-4 py-3 text-slate-900 font-medium">{{ item.productId }}</td>
                          <td class="px-4 py-3 text-slate-700">{{ item.description }}</td>
                          <td class="px-4 py-3 text-right text-slate-700">{{ item.expectedQuantity }}</td>
                          @if (session()?.status === 'IN_PROGRESS') {
                            <td class="px-4 py-3 text-right">
                              <input
                                type="number"
                                [(ngModel)]="item.zonaACount"
                                (blur)="updateItemCount(item)"
                                min="0"
                                class="w-full max-w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td class="px-4 py-3 text-right">
                              <input
                                type="number"
                                [(ngModel)]="item.zonaBCount"
                                (blur)="updateItemCount(item)"
                                min="0"
                                class="w-full max-w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td class="px-4 py-3 text-right">
                              <input
                                type="number"
                                [(ngModel)]="item.zonaCCount"
                                (blur)="updateItemCount(item)"
                                min="0"
                                class="w-full max-w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          } @else {
                            <td class="px-4 py-3 text-right text-slate-700">{{ item.zonaACount }}</td>
                            <td class="px-4 py-3 text-right text-slate-700">{{ item.zonaBCount }}</td>
                            <td class="px-4 py-3 text-right text-slate-700">{{ item.zonaCCount }}</td>
                          }
                          <td class="px-4 py-3 text-right font-medium text-slate-900">{{ calculateTotal(item) }}</td>
                          <td [ngClass]="item.discrepancy !== 0 ? 'text-red-600 font-bold' : 'text-slate-700'" class="px-4 py-3 text-right">
                            {{ item.discrepancy || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center">
                            @if (session()?.status === 'DRAFT' || session()?.status === 'IN_PROGRESS') {
                              <button
                                (click)="deleteItem(item.id!)"
                                class="text-red-600 hover:text-red-700 font-medium text-sm"
                              >
                                Delete
                              </button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Discrepancy Summary -->
                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p class="text-sm font-medium text-yellow-900">Discrepancies Found</p>
                  <p class="text-lg font-bold text-yellow-700 mt-1">
                    {{ getDiscrepancyCount() }} items with mismatches
                  </p>
                  @if (getDiscrepancyCount() > 0) {
                    <p class="text-xs text-yellow-700 mt-2">Items highlighted in yellow have discrepancies between expected and physical counts.</p>
                  }
                </div>
              }
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
export class InventorySessionDetailComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  session = signal<InventorySession | null>(null);
  isLoading = signal(false);
  editingItemId = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSession(id);
    }
  }

  private loadSession(id: string) {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.inventoryService
      .getSessionById(id, tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load inventory session');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(session => {
        this.session.set(session);
        // Calculate discrepancies
        if (session?.items) {
          session.items.forEach(item => {
            const total = item.zonaACount + item.zonaBCount + item.zonaCCount;
            item.totalPhysicalCount = total;
            item.discrepancy = total - item.expectedQuantity;
          });
        }
      });
  }

  addItem() {
    const session = this.session();
    if (!session) return;

    // Show modal or navigate to item form
    alert('Add item functionality - would open a form to add a new inventory item');
  }

  updateItemCount(item: InventoryItem) {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId || !item.id) return;

    const total = item.zonaACount + item.zonaBCount + item.zonaCCount;
    item.totalPhysicalCount = total;
    item.discrepancy = total - item.expectedQuantity;

    this.inventoryService
      .updateItem(item.id, {
        zonaACount: item.zonaACount,
        zonaBCount: item.zonaBCount,
        zonaCCount: item.zonaCCount
      }, tenantId)
      .subscribe({
        next: () => console.log('Item count updated'),
        error: () => console.error('Failed to update item count')
      });
  }

  deleteItem(itemId: string) {
    if (!confirm('Are you sure you want to remove this item?')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.inventoryService
      .deleteItem(itemId, tenantId)
      .subscribe({
        next: () => {
          // Remove item from session
          const session = this.session();
          if (session?.items) {
            session.items = session.items.filter(i => i.id !== itemId);
            this.session.set({ ...session });
          }
        },
        error: () => console.error('Failed to delete item')
      });
  }

  calculateTotal(item: InventoryItem): number {
    return item.zonaACount + item.zonaBCount + item.zonaCCount;
  }

  getDiscrepancyCount(): number {
    const items = this.session()?.items || [];
    return items.filter(item => (item.discrepancy || 0) !== 0).length;
  }

  startCounting() {
    const session = this.session();
    if (!session || !confirm('Start the inventory count? This will change the status to IN_PROGRESS.')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    const userId = this.authStore.userId()?.toString();
    if (!tenantId || !userId) return;

    this.isLoading.set(true);
    this.inventoryService
      .startSession(session.id!, userId, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => this.session.set(updated),
        error: () => console.error('Failed to start session')
      });
  }

  completeCount() {
    const session = this.session();
    if (!session || !confirm('Complete the count? This will change the status to COMPLETED.')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.inventoryService
      .completeSession(session.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => this.session.set(updated),
        error: () => console.error('Failed to complete session')
      });
  }

  confirmSession() {
    const session = this.session();
    if (!session || !confirm('Confirm the inventory count? This will finalize the session.')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    const userId = this.authStore.userId()?.toString();
    if (!tenantId || !userId) return;

    this.isLoading.set(true);
    this.inventoryService
      .confirmSession(session.id!, userId, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updated) => this.session.set(updated),
        error: () => console.error('Failed to confirm session')
      });
  }

  deleteSession() {
    const session = this.session();
    if (!session || !confirm('Are you sure you want to delete this session?')) return;

    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.inventoryService
      .deleteSession(session.id!, tenantId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['../'], { relativeTo: this.route }),
        error: () => console.error('Failed to delete session')
      });
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-700',
      'IN_PROGRESS': 'bg-orange-100 text-orange-700',
      'COMPLETED': 'bg-blue-100 text-blue-700',
      'CONFIRMED': 'bg-green-100 text-green-700'
    };
    return classMap[status] || 'bg-slate-100 text-slate-700';
  }
}
