import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../auth/auth.store';
import { IBranch } from '../../model/branch.model';
import { ICompany } from '../../model/company.model';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';

const ACTIVE_COMPANY_KEY = 'rm.activeCompanyId';
const ACTIVE_BRANCH_KEY = 'rm.activeBranchId';

@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authStore = inject(AuthStore);
  private readonly companyService = inject(CompanyService);
  private readonly branchService = inject(BranchService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly initializedSignal = signal(false);
  private readonly companiesSignal = signal<ICompany[]>([]);
  private readonly branchesSignal = signal<IBranch[]>([]);
  private readonly selectedCompanyIdSignal = signal<string | null>(null);
  private readonly selectedBranchIdSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly companies = this.companiesSignal.asReadonly();
  readonly branches = this.branchesSignal.asReadonly();
  readonly selectedCompanyId = this.selectedCompanyIdSignal.asReadonly();
  readonly selectedBranchId = this.selectedBranchIdSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly selectedCompany = computed(() => {
    const companyId = this.selectedCompanyIdSignal();
    return this.companiesSignal().find((company) => company.id === companyId) ?? null;
  });

  readonly selectedCompanyLabel = computed(() => {
    const selectedCompany = this.selectedCompany();
    const sessionCompany = this.authStore.currentUser()?.companyName?.trim() || null;

    return selectedCompany?.legalName || selectedCompany?.name || sessionCompany || 'Sin datos';
  });

  readonly selectedBranch = computed(() => {
    const branchId = this.selectedBranchIdSignal();
    return this.branchesSignal().find((branch) => branch.id === branchId) ?? null;
  });

  readonly selectedBranchLabel = computed(() => {
    const selectedBranch = this.selectedBranch();
    return selectedBranch?.name || 'Sin sucursal activa';
  });

  initialize(companyHint?: string): void {
    if (!this.isBrowser) {
      return;
    }

    if (!this.authStore.isAuthenticated()) {
      this.resetContextState();
      return;
    }

    if (this.initializedSignal() && this.companiesSignal().length > 0) {
      return;
    }

    this.initializedSignal.set(true);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        const activeCompanies = companies.filter((company) => company.active);
        this.companiesSignal.set(activeCompanies);

        const storedCompanyId = this.readStorage(ACTIVE_COMPANY_KEY);
        const hintedCompany = companyHint
          ? activeCompanies.find((company) => {
              const normalizedHint = companyHint.toLowerCase();
              return company.name.toLowerCase() === normalizedHint || company.legalName.toLowerCase() === normalizedHint;
            })
          : null;

        const defaultCompany = activeCompanies.find((company) => company.id === storedCompanyId)
          ?? hintedCompany
          ?? activeCompanies[0]
          ?? null;

        if (!defaultCompany) {
          this.loadingSignal.set(false);
          return;
        }

        this.selectedCompanyIdSignal.set(defaultCompany.id);
        this.writeStorage(ACTIVE_COMPANY_KEY, defaultCompany.id);
        this.loadBranches(defaultCompany.id);
      },
      error: () => {
        this.companiesSignal.set([]);
        this.branchesSignal.set([]);
        this.selectedCompanyIdSignal.set(null);
        this.selectedBranchIdSignal.set(null);
        this.errorSignal.set(null);
        this.loadingSignal.set(false);
        this.initializedSignal.set(false);
      },
    });
  }

  private resetContextState(): void {
    this.initializedSignal.set(false);
    this.companiesSignal.set([]);
    this.branchesSignal.set([]);
    this.selectedCompanyIdSignal.set(null);
    this.selectedBranchIdSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  selectCompany(companyId: string): void {
    if (!companyId || companyId === this.selectedCompanyIdSignal()) {
      return;
    }

    this.selectedCompanyIdSignal.set(companyId);
    this.writeStorage(ACTIVE_COMPANY_KEY, companyId);
    this.loadBranches(companyId);
  }

  selectBranch(branchId: string): void {
    this.selectedBranchIdSignal.set(branchId || null);

    if (branchId) {
      this.writeStorage(ACTIVE_BRANCH_KEY, branchId);
      return;
    }

    this.removeStorage(ACTIVE_BRANCH_KEY);
  }

  private loadBranches(companyId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.branchService.getBranchesByCompany(companyId).subscribe({
      next: (branches) => {
        const activeBranches = branches.filter((branch) => branch.active);
        this.branchesSignal.set(activeBranches);

        const storedBranchId = this.readStorage(ACTIVE_BRANCH_KEY);
        const defaultBranch = activeBranches.find((branch) => branch.id === storedBranchId)
          ?? activeBranches[0]
          ?? null;

        this.selectedBranchIdSignal.set(defaultBranch?.id ?? null);

        if (defaultBranch?.id) {
          this.writeStorage(ACTIVE_BRANCH_KEY, defaultBranch.id);
        } else {
          this.removeStorage(ACTIVE_BRANCH_KEY);
        }

        this.loadingSignal.set(false);
      },
      error: () => {
        this.branchesSignal.set([]);
        this.selectedBranchIdSignal.set(null);
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar las sucursales activas.');
      },
    });
  }

  private readStorage(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(key, value);
  }

  private removeStorage(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(key);
  }
}
