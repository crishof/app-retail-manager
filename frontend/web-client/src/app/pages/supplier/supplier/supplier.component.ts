import { CommonModule, NgClass } from "@angular/common";
import { Component, HostListener, OnDestroy, OnInit, inject } from "@angular/core";
import { ISupplier } from "../../../model/supplier.model";
import { ActivatedRoute, Router } from "@angular/router";
import { SupplierService } from "../../../services/supplier.service";
import { SupplierNavbarComponent } from "../supplier-navbar/supplier-navbar.component";
import { SupplierDetailsComponent } from "../supplier-details/supplier-details.component";
import { SupplierFormComponent } from "../supplier-form/supplier-form.component";
import { SupplierPurchaseHistoryComponent } from "../supplier-purchase-history/supplier-purchase-history.component";
import { SupplierAccountStatementComponent } from "../supplier-account-statement/supplier-account-statement.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Subscription } from "rxjs";

type SupplierTab = "supplier" | "margenes" | "contactos" | "inscripciones" | "compras" | "cuenta-corriente";

@Component({
  selector: "app-supplier",
  standalone: true,
  imports: [
    CommonModule,
    SupplierNavbarComponent,
    SupplierDetailsComponent,
    SupplierFormComponent,
    SupplierPurchaseHistoryComponent,
    SupplierAccountStatementComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: "./supplier.component.html",
  styleUrl: "./supplier.component.css",
})
export class SupplierComponent implements OnInit, OnDestroy {
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  supplierList: ISupplier[] = [];
  currentSupplier: ISupplier | null = null;

  searchTerm = "";
  isFormSubmitted = false;
  loading = false;
  errorMessage = "";

  selectedComponent: SupplierTab = "supplier";
  supplierModalOpen = false;
  supplierModalId: string | null = null;

  readonly tabs: SupplierTab[] = [
    "supplier",
    "compras",
    "cuenta-corriente",
    "margenes",
    "contactos",
    "inscripciones",
  ];

  readonly tabLabels: Record<SupplierTab, string> = {
    "supplier": "Proveedor",
    "compras": "Compras",
    "cuenta-corriente": "Cuenta corriente",
    "margenes": "Márgenes",
    "contactos": "Contactos",
    "inscripciones": "Inscripciones",
  };

  private subscription?: Subscription;
  private routeSubscription?: Subscription;

  ngOnInit(): void {
    this.loadAllSuppliers();
    this.routeSubscription = this.route.data.subscribe((data) => {
      if (data['defaultTab'] === 'cuenta-corriente') {
        this.activateAccountStatementTab();
      }
    });
  }

  loadAllSuppliers(): void {
    this.loading = true;
    this.errorMessage = "";
    this.subscription?.unsubscribe();
    this.subscription = this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.supplierList = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading suppliers", err);
        this.errorMessage = "No se pudieron cargar los proveedores.";
        this.loading = false;
      },
    });
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.onFormSubmit();
    }
  }

  onFormSubmit(): void {
    this.isFormSubmitted = true;
    const search = this.searchTerm.trim();

    if (search.length === 0) {
      this.loadAllSuppliers();
      return;
    }

    if (search.length < 3) {
      this.supplierList = [];
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.subscription?.unsubscribe();
    this.subscription = this.supplierService
      .getSuppliers(search)
      .subscribe({
        next: (data) => {
          this.supplierList = data;
          this.loading = false;
        },
        error: (err) => {
          console.error("Error searching suppliers", err);
          this.errorMessage = "No se pudo realizar la búsqueda.";
          this.loading = false;
        },
      });
  }

  onSearchInput(): void {
    if (this.searchTerm.length === 0 && this.isFormSubmitted) {
      this.loadAllSuppliers();
    }
  }

  clearSearch(): void {
    this.searchTerm = "";
    this.isFormSubmitted = false;
    this.loadAllSuppliers();
  }

  selectSupplier(supplier: ISupplier): void {
    this.supplierService.setSelectedSupplier(supplier);
    this.currentSupplier = supplier;
  }

  navigateNewSupplier(): void {
    this.supplierModalId = null;
    this.supplierModalOpen = true;
  }

  navigateEditSupplier(): void {
    if (!this.currentSupplier) return;
    this.supplierModalId = this.currentSupplier.id;
    this.supplierModalOpen = true;
  }

  closeSupplierModal(): void {
    this.supplierModalOpen = false;
    this.supplierModalId = null;
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.supplierModalOpen) {
      this.closeSupplierModal();
    }
  }

  onSupplierSaved(): void {
    this.closeSupplierModal();
    this.loadAllSuppliers();
  }

  trackBySupplierId(_: number, supplier: ISupplier): string {
    return supplier.id;
  }

  navigate(id: string): void {
    this.router.navigate(["/supplier", id]);
  }

  activateAccountStatementTab(): void {
    this.selectedComponent = 'cuenta-corriente';
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
}
