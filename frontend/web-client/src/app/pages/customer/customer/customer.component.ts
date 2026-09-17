import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICustomer } from '../../../model/customer.model';
import { CustomerService } from '../../../services/customer.service';
import { CustomerSaleHistoryComponent } from '../customer-sale-history/customer-sale-history.component';

@Component({
    selector: 'app-customer',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CustomerSaleHistoryComponent],
    templateUrl: './customer.component.html',
    styleUrl: './customer.component.css'
})
export class CustomerComponent implements OnInit, OnDestroy {
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(FormBuilder);
  private sub?: Subscription;

  customers: ICustomer[] = [];
  currentCustomer: ICustomer | null = null;
  searchTerm = '';
  loading = false;
  errorMessage = '';

  // Form state
  showForm = false;
  editingId: string | null = null;
  isSaving = false;
  saveError = '';
  form!: FormGroup;
  activeTab: 'datos' | 'ventas' = 'datos';

  ngOnInit(): void {
    this.initForm();
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  initForm(customer?: ICustomer): void {
    this.form = this.fb.group({
      name:     [customer?.name     ?? '', Validators.required],
      lastname: [customer?.lastname ?? '', Validators.required],
      dni:      [customer?.dni      ?? ''],
      taxId:    [customer?.taxId    ?? ''],
      email:    [customer?.email    ?? ''],
      phone:    [customer?.phone    ?? ''],
    });
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';
    this.sub?.unsubscribe();
    this.sub = this.customerService.getAll().subscribe({
      next: (data) => { this.customers = data; this.loading = false; },
      error: () => { this.errorMessage = 'No se pudieron cargar los clientes.'; this.loading = false; }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim();
    if (!term) { this.loadAll(); return; }
    if (term.length < 2) { return; }
    this.loading = true;
    this.errorMessage = '';
    this.sub?.unsubscribe();
    this.sub = this.customerService.getAll(term).subscribe({
      next: (data) => { this.customers = data; this.loading = false; },
      error: () => { this.errorMessage = 'Error en búsqueda.'; this.loading = false; }
    });
  }

  selectCustomer(customer: ICustomer): void {
    this.currentCustomer = customer;
    this.showForm = false;
    this.activeTab = 'datos';
  }

  openNew(): void {
    this.editingId = null;
    this.initForm();
    this.saveError = '';
    this.showForm = true;
  }

  openEdit(): void {
    if (!this.currentCustomer) return;
    this.editingId = this.currentCustomer.id ?? null;
    this.initForm(this.currentCustomer);
    this.saveError = '';
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.saveError = '';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving = true;
    this.saveError = '';
    const payload: ICustomer = this.form.value;

    const op$ = this.editingId
      ? this.customerService.update(this.editingId, payload)
      : this.customerService.create(payload);

    op$.subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.showForm = false;
        this.currentCustomer = saved;
        this.loadAll();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message ?? 'Error al guardar.';
      }
    });
  }

  deleteCustomer(): void {
    if (!this.currentCustomer?.id) return;
    if (!confirm(`¿Eliminar a ${this.currentCustomer.name} ${this.currentCustomer.lastname}?`)) return;
    this.customerService.delete(this.currentCustomer.id).subscribe({
      next: () => { this.currentCustomer = null; this.loadAll(); },
      error: () => { this.errorMessage = 'No se pudo eliminar el cliente.'; }
    });
  }

  trackById(_: number, c: ICustomer): string { return c.id ?? ''; }
}
