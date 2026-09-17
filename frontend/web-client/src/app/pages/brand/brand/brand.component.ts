
import { Component, Input, OnInit, inject } from "@angular/core";
import { IBrand } from "../../../model/brand.model";
import { BrandService } from "../../../services/brand.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormBuilder, Validators } from "@angular/forms";
import { ProductService } from "../../../services/product.service";
import { ModalDialogService } from "../../../services/modal-dialog.service";

@Component({
  selector: "app-brand",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
],
  templateUrl: "./brand.component.html",
  styleUrl: "./brand.component.css",
})
export class BrandComponent implements OnInit {
  private readonly brandService = inject(BrandService);
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialogService = inject(ModalDialogService);

  @Input() selectionMode: "click" | "dblclick" = "click";

  brandList: IBrand[] = [];
  filteredBrandList: IBrand[] = [];

  searchTerm = "";

  sortedColumn?: keyof IBrand;
  isAscendingOrder = true;

  selectedBrand: IBrand | null = null;
  selectedBrandProducts = 0;

  totalElements = 0;
  loading = false;
  detailLoading = false;
  createModalOpen = false;
  editModalOpen = false;
  createLogoFile: File | null = null;
  editLogoFile: File | null = null;
  savingCreate = false;
  savingEdit = false;
  successMessage = "";
  errorMessage = "";

  readonly createForm = this.fb.group({
    brandName: ["", Validators.required],
  });

  readonly editForm = this.fb.group({
    brandName: ["", Validators.required],
  });

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(selectedBrandId?: string): void {
    this.loading = true;
    this.errorMessage = "";

    this.brandService.getBrands({ page: 0, size: 50 }).subscribe({
      next: (page) => {
        this.brandList = page.content;
        this.filteredBrandList = [...page.content];
        this.totalElements = page.totalElements;
        this.loading = false;

        if (!this.brandList.length) {
          this.selectedBrand = null;
          this.selectedBrandProducts = 0;
          return;
        }

        const preferred = selectedBrandId
          ? this.brandList.find((b) => b.id === selectedBrandId)
          : null;

        this.onBrandSelect(preferred ?? this.brandList[0]);
      },
      error: (err) => {
        console.error("Error loading brands", err);
        this.errorMessage = "No se pudieron cargar las marcas.";
        this.loading = false;
      },
    });
  }

  searchBrand(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredBrandList = [...this.brandList];
      return;
    }

    this.filteredBrandList = this.brandList.filter(
      (brand) =>
        brand.name.toLowerCase().includes(term) ||
        brand.id.toString().includes(term),
    );

    if (this.filteredBrandList.length && !this.selectedBrand) {
      this.onBrandSelect(this.filteredBrandList[0]);
    }
  }

  sortColumn(column: keyof IBrand): void {
    this.isAscendingOrder =
      this.sortedColumn === column ? !this.isAscendingOrder : true;
    this.sortedColumn = column;

    const factor = this.isAscendingOrder ? 1 : -1;

    this.filteredBrandList.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue == null || bValue == null) return 0;
      return aValue > bValue ? factor : -factor;
    });
  }

  onBrandSelect(brand: IBrand): void {
    this.selectedBrand = brand;
    this.detailLoading = true;
    this.successMessage = "";

    this.productService.countProducts({ brandId: brand.id.toString() }).subscribe({
      next: (count) => {
        this.selectedBrandProducts = count;
        this.detailLoading = false;
      },
      error: () => {
        this.selectedBrandProducts = 0;
        this.detailLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.createForm.reset({ brandName: "" });
    this.createLogoFile = null;
    this.createModalOpen = true;
    this.successMessage = "";
    this.errorMessage = "";
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  openEditModal(): void {
    if (!this.selectedBrand) return;
    this.editForm.reset({ brandName: this.selectedBrand.name });
    this.editLogoFile = null;
    this.editModalOpen = true;
    this.successMessage = "";
    this.errorMessage = "";
  }

  closeEditModal(): void {
    this.editModalOpen = false;
  }

  onCreateLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createLogoFile = input.files?.[0] ?? null;
  }

  onEditLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editLogoFile = input.files?.[0] ?? null;
  }

  submitCreate(): void {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const name = this.createForm.controls.brandName.value?.trim() ?? "";
    this.savingCreate = true;

    this.brandService.createBrand(name, this.createLogoFile ?? undefined).subscribe({
      next: (brand) => {
        this.savingCreate = false;
        this.closeCreateModal();
        this.successMessage = "Marca creada correctamente.";
        this.loadBrands(brand.id.toString());
      },
      error: () => {
        this.savingCreate = false;
        this.errorMessage = "No se pudo crear la marca.";
      },
    });
  }

  submitEdit(): void {
    if (!this.selectedBrand) return;

    this.errorMessage = "";
    this.successMessage = "";

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const name = this.editForm.controls.brandName.value?.trim() ?? "";
    this.savingEdit = true;

    this.brandService
      .updateBrand(this.selectedBrand.id, name, this.editLogoFile ?? undefined)
      .subscribe({
        next: (brand) => {
          this.savingEdit = false;
          this.closeEditModal();
          this.successMessage = "Marca actualizada correctamente.";
          this.loadBrands(brand.id.toString());
        },
        error: () => {
          this.savingEdit = false;
          this.errorMessage = "No se pudo actualizar la marca.";
        },
      });
  }

  confirmDeleteBrand(): void {
    if (!this.selectedBrand) return;

    this.confirmDialogService.openConfirmDialog().subscribe((confirmed) => {
      if (!confirmed || !this.selectedBrand) return;

      this.brandService.deleteBrand(this.selectedBrand.id.toString()).subscribe({
        next: () => {
          this.successMessage = "Marca eliminada correctamente.";
          this.errorMessage = "";
          this.loadBrands();
        },
        error: () => {
          this.errorMessage = "No se pudo eliminar la marca.";
        },
      });
    });
  }

  hasError(formType: "create" | "edit", field: "brandName", error: string): boolean {
    const form = formType === "create" ? this.createForm : this.editForm;
    const control = form.get(field);
    return !!(control && control.touched && control.hasError(error));
  }

  logoUrl(brand: IBrand): string {
    return brand.logoUrl || "assets/images/no-image-100.png";
  }
}
