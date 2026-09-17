
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IBranch, IBranchRequest } from '../../../model/branch.model';
import { ICompany } from '../../../model/company.model';
import { ILocation, ILocationRequest, LocationType } from '../../../model/location.model';
import { BranchService } from '../../../services/branch.service';
import { CompanyService } from '../../../services/company.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.css',
})
export class BranchesComponent implements OnInit {
  private readonly branchService = inject(BranchService);
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  branches: IBranch[] = [];
  companies: ICompany[] = [];
  selectedBranch: IBranch | null = null;
  selectedCompanyIdFilter = '';

  loading = false;
  successMessage = '';
  errorMessage = '';

  branchEditorMode: 'create' | 'edit' = 'create';
  locationEditorMode: 'create' | 'edit' = 'create';
  editingLocationId: string | null = null;
  deletingBranch: IBranch | null = null;
  deletingLocation: ILocation | null = null;
  saving = false;
  private companiesLoaded = false;
  private pendingSelectionId: string | null = null;

  readonly locationTypes: { value: LocationType; label: string }[] = [
    { value: 'SALES', label: 'Mostrador / Ventas' },
    { value: 'WAREHOUSE', label: 'Depósito' },
    { value: 'TRANSIT', label: 'Tránsito' },
    { value: 'CONSIGNMENT', label: 'Consignación' },
  ];

  readonly branchForm = this.fb.group({
    companyId: ['', Validators.required],
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', Validators.required],
    address: [''],
    locality: [''],
    postalCode: [''],
    country: [''],
    phone: [''],
    email: ['', Validators.email],
    website: [''],
    pointOfSale: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
    active: [true],
  });

  readonly locationForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', Validators.required],
    address: [''],
    locationType: ['SALES' as LocationType, Validators.required],
    active: [true],
  });

  ngOnInit(): void {
    this.selectedCompanyIdFilter = this.route.snapshot.queryParamMap.get('companyId') ?? '';
    this.loadCompanies();
    this.loadBranches();
    this.startCreateBranch(false);
  }

  loadCompanies(): void {
    this.errorMessage = '';
    this.companyService.getCompanies().subscribe({
      next: (list) => {
        this.companiesLoaded = true;
        this.companies = list;
        if (this.selectedCompanyIdFilter && !list.some(c => c.id === this.selectedCompanyIdFilter)) {
          this.selectedCompanyIdFilter = '';
        }

        if (!this.selectedCompanyIdFilter && list.length && !this.branchForm.value.companyId) {
          this.branchForm.patchValue({ companyId: list[0].id });
        }

        if (this.errorMessage === 'Primero debe crear una empresa para poder crear sucursales.' && list.length) {
          this.errorMessage = '';
        }
      },
      error: (err) => {
        this.companiesLoaded = true;
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          this.companies = [];
          this.selectedCompanyIdFilter = '';
        } else {
          this.errorMessage = this.extractErrorMessage(err, 'No se pudieron cargar las empresas.');
        }
      },
    });
  }

  loadBranches(): void {
    this.loading = true;
    const req$ = this.selectedCompanyIdFilter
      ? this.branchService.getBranchesByCompany(this.selectedCompanyIdFilter)
      : this.branchService.getBranches();

    req$.subscribe({
      next: (list) => {
        this.branches = list;

        const preferredId = this.pendingSelectionId ?? this.selectedBranch?.id ?? null;
        this.pendingSelectionId = null;

        if (preferredId) {
          const preferred = list.find(b => b.id === preferredId) ?? null;
          if (preferred) {
            this.selectBranch(preferred);
          } else {
            this.startCreateBranch(false);
          }
        } else if (!list.length) {
          this.startCreateBranch(false);
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'No se pudieron cargar las sucursales.');
        this.loading = false;
      },
    });
  }

  onCompanyFilterChange(companyId: string): void {
    this.selectedCompanyIdFilter = companyId;
    this.selectedBranch = null;
    this.loadBranches();
    const queryParams = companyId ? { companyId } : {};
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: '' });
  }

  selectBranch(branch: IBranch): void {
    this.selectedBranch = branch;
    this.branchEditorMode = 'edit';
    this.branchForm.setValue({
      companyId: branch.companyId,
      code: branch.code,
      name: branch.name,
      address: branch.address ?? '',
      locality: branch.locality ?? '',
      postalCode: branch.postalCode ?? '',
      country: branch.country ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      website: branch.website ?? '',
      pointOfSale: branch.pointOfSale,
      active: branch.active,
    });

    this.startCreateLocation();
  }

  getCompanyName(companyId: string): string {
    return this.companies.find(c => c.id === companyId)?.name ?? 'Sin empresa';
  }

  startCreateBranch(showMissingCompanyMessage = true): void {
    if (!this.companies.length) {
      if (showMissingCompanyMessage && this.companiesLoaded) {
        this.errorMessage = 'Primero debe crear una empresa para poder crear sucursales.';
      }
      return;
    }
    this.branchEditorMode = 'create';
    this.selectedBranch = null;
    this.branchForm.reset({
      companyId: this.selectedCompanyIdFilter,
      code: '',
      name: '',
      address: '',
      locality: '',
      postalCode: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      active: true,
      pointOfSale: 1,
    });
    this.startCreateLocation();
  }

  startEditBranch(branch: IBranch): void {
    this.selectBranch(branch);
  }

  saveBranch(): void {
    this.errorMessage = '';
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const request = this.branchForm.value as IBranchRequest;

    const op$ = this.branchEditorMode === 'create'
      ? this.branchService.createBranch(request)
      : this.branchService.updateBranch(this.selectedBranch?.id ?? '', request);

    op$.subscribe({
      next: (branch) => {
        this.successMessage = this.branchEditorMode === 'create'
          ? 'Sucursal creada correctamente.'
          : 'Sucursal actualizada.';
        this.pendingSelectionId = branch.id;
        this.branchEditorMode = 'edit';
        this.saving = false;
        this.loadBranches();
        this.clearMessages();
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Error al guardar la sucursal.');
        this.saving = false;
      },
    });
  }

  confirmDeleteBranch(branch: IBranch, event: Event): void {
    event.stopPropagation();
    this.deletingBranch = branch;
  }

  deleteBranch(): void {
    if (!this.deletingBranch) return;
    const deletingId = this.deletingBranch.id;
    this.branchService.deleteBranch(deletingId).subscribe({
      next: () => {
        this.successMessage = 'Sucursal eliminada.';
        if (this.selectedBranch?.id === deletingId) {
          this.startCreateBranch();
        }
        this.deletingBranch = null;
        this.loadBranches();
        this.clearMessages();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la sucursal.';
        this.deletingBranch = null;
      },
    });
  }

  cancelDeleteBranch(): void {
    this.deletingBranch = null;
  }

  startCreateLocation(): void {
    this.locationEditorMode = 'create';
    this.editingLocationId = null;
    this.locationForm.reset({
      code: '',
      name: '',
      address: '',
      locationType: 'SALES',
      active: true,
    });
  }

  startEditLocation(location: ILocation): void {
    this.locationEditorMode = 'edit';
    this.editingLocationId = location.id;
    this.locationForm.setValue({
      code: location.code,
      name: location.name,
      address: location.address ?? '',
      locationType: location.locationType,
      active: location.active,
    });
  }

  saveLocation(): void {
    if (this.locationForm.invalid || !this.selectedBranch) return;
    this.saving = true;
    const request = this.locationForm.value as ILocationRequest;
    const branchId = this.selectedBranch.id;

    const op$ = this.locationEditorMode === 'create'
      ? this.branchService.createLocation(branchId, request)
      : this.branchService.updateLocation(branchId, this.editingLocationId ?? '', request);

    op$.subscribe({
      next: (updated) => {
        this.successMessage = this.locationEditorMode === 'create'
          ? 'Depósito creado correctamente.'
          : 'Depósito actualizado.';
        this.saving = false;
        this.pendingSelectionId = updated.id;
        this.startCreateLocation();
        this.loadBranches();
        this.clearMessages();
      },
      error: () => {
        this.errorMessage = 'Error al guardar el depósito.';
        this.saving = false;
      },
    });
  }

  confirmDeleteLocation(location: ILocation): void {
    this.deletingLocation = location;
  }

  deleteLocation(): void {
    if (!this.deletingLocation || !this.selectedBranch) return;
    this.branchService.deleteLocation(this.selectedBranch.id, this.deletingLocation.id).subscribe({
      next: (updated) => {
        this.successMessage = 'Depósito eliminado.';
        this.pendingSelectionId = updated.id;
        this.startCreateLocation();
        this.deletingLocation = null;
        this.loadBranches();
        this.clearMessages();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar el depósito.';
        this.deletingLocation = null;
      },
    });
  }

  cancelDeleteLocation(): void {
    this.deletingLocation = null;
  }

  get selectedCompany(): ICompany | null {
    if (!this.selectedCompanyIdFilter) return null;
    return this.companies.find(c => c.id === this.selectedCompanyIdFilter) ?? null;
  }

  get selectedBranchCompany(): ICompany | null {
    if (!this.selectedBranch) return null;
    return this.companies.find(c => c.id === this.selectedBranch?.companyId) ?? null;
  }

  get branchEditorTitle(): string {
    return this.branchEditorMode === 'create' ? 'Nueva sucursal' : 'Editar sucursal';
  }

  get locationEditorTitle(): string {
    return this.locationEditorMode === 'create' ? 'Nuevo depósito' : 'Editar depósito';
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 3000);
  }

  locationTypeLabel(type: LocationType): string {
    const labels: Record<LocationType, string> = {
      'SALES': 'Mostrador / Ventas',
      'WAREHOUSE': 'Depósito',
      'TRANSIT': 'Tránsito',
      'CONSIGNMENT': 'Consignación',
    };
    return labels[type] ?? type;
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
}
