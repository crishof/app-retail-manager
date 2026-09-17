import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BrandService } from '../../../services/brand.service';
import { IBrand } from '../../../model/brand.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-brand-create',
  imports: [CommonModule, ReactiveFormsModule, NgClass],
  templateUrl: './brand-create.component.html',
  styleUrl: './brand-create.component.css'
})
export class BrandCreateComponent {
  private formBuilder = inject(FormBuilder);

  @Output() onCancel = new EventEmitter<void>();

  brandForm!: FormGroup;
  private brandService = inject(BrandService);
  private router = inject(Router);

  successMessage = '';
  errorMessage = '';
  file: File | null = null;

  constructor() {
    this.brandForm = this.formBuilder.group({
      brandName: ['', Validators.required],
    });
  }

  enviar(event: Event) {
    event.preventDefault();

    const name = this.brandForm.get('brandName')?.value;

    if (!name) {
      this.errorMessage = 'Brand name is required';
      return;
    }

    this.brandService.createBrand(name, this.file ?? undefined).subscribe({
      next: () => {
        this.successMessage = 'Brand created successfully';
        this.errorMessage = '';
        this.onCancel.emit();
      },
      error: (error) => {
        this.errorMessage = 'Error creating brand';
        console.error(error);
      }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files?.length) {
      this.file = event.target.files[0];
    }
  }

  toList(): void {
    this.onCancel.emit();
    this.router.navigate(['/brand']);
  }

  hasErrors(field: string, typeError: string) {
    const control = this.brandForm.get(field);
    return control?.hasError(typeError) && control.touched;
  }
}