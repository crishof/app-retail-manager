
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ICompany, ICompanyRequest } from '../../../model/company.model';
import { CompanyService } from '../../../services/company.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.css',
})
export class CompaniesComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  companies: ICompany[] = [];
  selectedCompany: ICompany | null = null;
  editorMode: 'create' | 'edit' = 'create';

  loading = false;
  successMessage = '';
  errorMessage = '';

  deleting: ICompany | null = null;
  saving = false;
  private pendingSelectionId: string | null = null;

  readonly ivaOptions: string[] = [
    'Responsable Inscripto',
    'Monotributo',
    'Exento',
    'Consumidor Final',
    'No Responsable',
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    legalName: ['', [Validators.required, Validators.minLength(2)]],
    ivaStatus: ['', Validators.required],
    cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]],
    startOfActivities: [''],
    grossIncomeNumber: [''],
    email: ['', [Validators.email]],
    phone: ['', Validators.maxLength(20)],
    website: ['', Validators.maxLength(255)],
    active: [true],
  });

  ngOnInit(): void {
    this.loadCompanies();
    this.startCreateCompany();
  }

  loadCompanies(): void {
    this.errorMessage = '';
    this.loading = true;
    this.companyService.getCompanies().subscribe({
      next: (list) => {
        this.companies = list;
        const preferredId = this.pendingSelectionId ?? this.selectedCompany?.id ?? null;
        this.pendingSelectionId = null;

        if (preferredId) {
          const selected = list.find(c => c.id === preferredId) ?? null;
          if (selected) {
            this.selectCompany(selected);
          } else {
            this.startCreateCompany();
          }
        } else if (this.editorMode === 'edit' && list.length) {
          this.selectCompany(list[0]);
        } else if (!list.length) {
          this.startCreateCompany();
        }
        this.loading = false;
      },
      error: (err) => {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          this.companies = [];
          this.startCreateCompany();
        } else {
          this.errorMessage = this.extractErrorMessage(err, 'No se pudieron cargar las empresas.');
        }
        this.loading = false;
      },
    });
  }

  selectCompany(company: ICompany): void {
    this.selectedCompany = company;
    this.editorMode = 'edit';
    this.form.setValue({
      name: company.name,
      legalName: company.legalName ?? company.name,
      ivaStatus: company.ivaStatus ?? '',
      cuit: company.cuit,
      startOfActivities: company.startOfActivities ?? '',
      grossIncomeNumber: company.grossIncomeNumber ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      active: company.active,
    });
  }

  startCreateCompany(): void {
    this.editorMode = 'create';
    this.selectedCompany = null;
    this.form.reset({
      name: '',
      legalName: '',
      ivaStatus: '',
      cuit: '',
      startOfActivities: '',
      grossIncomeNumber: '',
      email: '',
      phone: '',
      website: '',
      active: true,
    });
  }

  save(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const request = {
      ...(this.form.value as ICompanyRequest),
      cuit: this.formatCuit(this.form.value.cuit ?? ''),
    };

    const op$ = this.editorMode === 'create'
      ? this.companyService.createCompany(request)
      : this.companyService.updateCompany(this.selectedCompany?.id ?? '', request);

    op$.subscribe({
      next: (company) => {
        this.successMessage = this.editorMode === 'create'
          ? 'Empresa creada correctamente.'
          : 'Empresa actualizada.';
        this.pendingSelectionId = company.id;
        this.saving = false;
        this.editorMode = 'edit';
        this.loadCompanies();
        this.clearMessages();
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Error al guardar la empresa.');
        this.saving = false;
      },
    });
  }

  goToBranches(company: ICompany): void {
    this.router.navigate(['/configuracion/general/sucursales'], { queryParams: { companyId: company.id } });
  }

  confirmDelete(company: ICompany): void {
    this.deleting = company;
  }

  delete(): void {
    if (!this.deleting) return;
    const deletingId = this.deleting.id;
    this.companyService.deleteCompany(deletingId).subscribe({
      next: () => {
        this.successMessage = 'Empresa eliminada.';
        if (this.selectedCompany?.id === deletingId) {
          this.startCreateCompany();
        }
        this.deleting = null;
        this.loadCompanies();
        this.clearMessages();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la empresa.';
        this.deleting = null;
      },
    });
  }

  cancelDelete(): void {
    this.deleting = null;
  }

  onCuitInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCuit(input.value ?? '');
    this.form.controls.cuit.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  get editorTitle(): string {
    return this.editorMode === 'create' ? 'Nueva empresa' : 'Editar empresa';
  }

  get canNavigateToBranches(): boolean {
    return !!this.selectedCompany;
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string } | string; message?: string };
    if (typeof e?.error === 'string') return e.error;
    if (e?.error && typeof e.error === 'object' && 'message' in e.error) {
      const msg = e.error.message;
      return typeof msg === 'string' ? msg : fallback;
    }
    return e?.message ?? fallback;
  }

  private formatCuit(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 10);
    const part3 = digits.slice(10, 11);

    if (digits.length <= 2) return part1;
    if (digits.length <= 10) return `${part1}-${part2}`;
    return `${part1}-${part2}-${part3}`;
  }
}
