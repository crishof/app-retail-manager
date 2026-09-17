
import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { SupplierService } from "../../../services/supplier.service";
import { ISupplier } from "../../../model/supplier.model";

@Component({
  selector: "app-supplier-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./supplier-form.component.html",
  styleUrl: "./supplier-form.component.css",
})
export class SupplierFormComponent implements OnInit {
  @Input() supplierIdInput: string | null = null;
  @Input() modalMode = false;
  @Output() saved = new EventEmitter<ISupplier>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  supplierId: string | null = null;
  loading = false;
  saving = false;
  successMessage = "";
  errorMessage = "";

  readonly form = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    legalName: ["", [Validators.required, Validators.minLength(2)]],
    taxId: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]],
  });

  get isEditMode(): boolean {
    return !!this.supplierId;
  }

  ngOnInit(): void {
    this.supplierId = this.supplierIdInput ?? this.route.snapshot.paramMap.get("id");

    if (!this.supplierId) return;

    this.loading = true;
    this.supplierService.getSupplierById(this.supplierId).subscribe({
      next: (supplier) => {
        this.form.patchValue({
          name: supplier.name,
          legalName: supplier.legalName,
          taxId: this.applyTaxIdMask(supplier.taxId),
        });
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "No se pudo cargar el proveedor para edición.";
        this.loading = false;
      },
    });
  }

  submit(): void {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.form.controls.name.value?.trim() ?? "",
      legalName: this.form.controls.legalName.value?.trim() ?? "",
      taxId: this.applyTaxIdMask(this.form.controls.taxId.value ?? ""),
    };

    this.saving = true;

    const request$ = this.isEditMode && this.supplierId
      ? this.supplierService.updateSupplier(this.supplierId, payload)
      : this.supplierService.createSupplier(payload);

    request$.subscribe({
      next: (supplier) => {
        this.successMessage = this.isEditMode
          ? "Proveedor actualizado correctamente."
          : "Proveedor creado correctamente.";
        this.supplierService.setSelectedSupplier(supplier);
        this.saving = false;
        if (this.modalMode) {
          this.saved.emit(supplier);
          return;
        }

        this.router.navigate(["/supplier"]);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || "No se pudo guardar el proveedor.";
        this.saving = false;
      },
    });
  }

  cancel(): void {
    if (this.modalMode) {
      this.cancelled.emit();
      return;
    }

    this.router.navigate(["/supplier"]);
  }

  hasError(field: "name" | "legalName" | "taxId", error: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.touched && control.hasError(error));
  }

  onTaxIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = this.applyTaxIdMask(input.value);

    this.form.controls.taxId.setValue(masked, { emitEvent: false });
    input.value = masked;
  }

  private applyTaxIdMask(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;

    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
  }
}
