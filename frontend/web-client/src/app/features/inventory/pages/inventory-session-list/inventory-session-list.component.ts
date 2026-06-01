import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { InventoryService, InventorySession } from '../../../../core/services/inventory.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-inventory-session-list',
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
              <h1 class="text-3xl font-bold text-slate-900">Inventory Sessions</h1>
              <p class="text-slate-500 mt-1">Manage periodic inventory counts</p>
            </div>
            <button
              routerLink="new"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              + New Session
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
               placeholder="Search by description, branch, or deposit..."
               class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
             <select
               [value]="statusFilter()"
               (change)="statusFilter.set($any($event.target).value)"
               class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="">All Statuses</option>
               <option value="DRAFT">Draft</option>
               <option value="IN_PROGRESS">In Progress</option>
               <option value="COMPLETED">Completed</option>
               <option value="CONFIRMED">Confirmed</option>
             </select>
             <input
               type="date"
               [value]="startDateFilter()"
               (change)="startDateFilter.set($any($event.target).value)"
               placeholder="Start date"
               class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
             <input
               type="date"
               [value]="endDateFilter()"
               (change)="endDateFilter.set($any($event.target).value)"
               placeholder="End date"
               class="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-6 pb-6">
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="text-slate-500">
              <div class="animate-spin text-2xl mb-2">⏳</div>
              Loading inventory sessions...
            </div>
          </div>
        } @else if (filteredSessions().length === 0) {
          <div class="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div class="text-4xl mb-3">📦</div>
            <p class="text-slate-600 font-medium">No inventory sessions found</p>
            <p class="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new session</p>
          </div>
        } @else {
          <!-- Table -->
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Branch</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Deposit</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Start Date</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (session of filteredSessions(); track session.id) {
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="[session.id]"
                          class="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {{ session.description }}
                        </a>
                      </td>
                      <td class="px-6 py-4 text-slate-700">{{ session.branchId }}</td>
                      <td class="px-6 py-4 text-slate-700">{{ session.depositId }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ session.startDate | date: 'short' }}</td>
                      <td class="px-6 py-4">
                        <span
                          [ngClass]="getStatusBadgeClass(session.status)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ session.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          [routerLink]="[session.id]"
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
               <p class="text-slate-600 text-sm">Total Sessions</p>
               <p class="text-2xl font-bold text-slate-900 mt-1">{{ filteredSessions().length }}</p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">In Progress</p>
               <p class="text-2xl font-bold text-orange-600 mt-1">{{ inProgressCount() }}</p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">Completed</p>
               <p class="text-2xl font-bold text-blue-600 mt-1">{{ completedCount() }}</p>
             </div>
             <div class="bg-white rounded-lg border border-slate-200 p-4">
               <p class="text-slate-600 text-sm">Confirmed</p>
               <p class="text-2xl font-bold text-green-600 mt-1">{{ confirmedCount() }}</p>
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
export class InventorySessionListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  sessions = signal<InventorySession[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');
  startDateFilter = signal('');
  endDateFilter = signal('');

  filteredSessions = computed(() => {
    const sessions = this.sessions();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const startDate = this.startDateFilter();
    const endDate = this.endDateFilter();

    return sessions.filter(session => {
      const matchesSearch =
        session.description.toLowerCase().includes(search) ||
        session.branchId.toLowerCase().includes(search) ||
        session.depositId.toLowerCase().includes(search);

      const matchesStatus = !status || session.status === status;

      let matchesDateRange = true;
      if (startDate && session.startDate) {
        matchesDateRange = new Date(session.startDate) >= new Date(startDate);
      }
      if (endDate && session.startDate) {
        matchesDateRange = matchesDateRange && new Date(session.startDate) <= new Date(endDate);
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  });

  inProgressCount = computed(() => {
    return this.filteredSessions().filter(s => s.status === 'IN_PROGRESS').length;
  });

  completedCount = computed(() => {
    return this.filteredSessions().filter(s => s.status === 'COMPLETED').length;
  });

  confirmedCount = computed(() => {
    return this.filteredSessions().filter(s => s.status === 'CONFIRMED').length;
  });

  ngOnInit() {
    this.loadSessions();
  }

  private loadSessions() {
    const tenantId = this.authStore.tenantId()?.toString();
    if (!tenantId) return;

    this.isLoading.set(true);
    this.inventoryService
      .getAllSessions(tenantId)
      .pipe(
        catchError(() => {
          console.error('Failed to load inventory sessions');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(sessions => this.sessions.set(sessions));
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
