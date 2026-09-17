import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ISupplierProduct } from '../../../model/supplierProduct';
import { IProduct } from '../../../model/product.model';
import { ProductService } from '../../../services/product.service';
import { ProductPriceLinkService } from '../../../services/product-price-link.service';

@Component({
  selector: 'app-link-product-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './link-product-modal.component.html',
  styleUrl: './link-product-modal.component.css',
})
export class LinkProductModalComponent implements OnChanges {
  private readonly productService = inject(ProductService);
  private readonly linkService = inject(ProductPriceLinkService);

  @Input() supplierProduct: ISupplierProduct | null = null;
  @Input() isOpen = false;
  @Output() linked = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  searchTerm = '';
  products: IProduct[] = [];
  selectedProduct: IProduct | null = null;
  loading = false;
  linking = false;
  errorMessage = '';
  successMessage = '';

  ngOnChanges(): void {
    if (this.isOpen) {
      this.reset();
      this.searchProducts();
    }
  }

  searchProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getProducts({ search: this.searchTerm, size: 30 }).subscribe({
      next: (page) => {
        this.products = page.content;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.loading = false;
      },
    });
  }

  selectProduct(product: IProduct): void {
    this.selectedProduct = product;
  }

  confirmLink(): void {
    if (!this.supplierProduct || !this.selectedProduct) return;
    this.linking = true;
    this.errorMessage = '';

    this.linkService.createLink({
      supplierProductId: this.supplierProduct.id,
      productId: this.selectedProduct.id,
      supplierCode: this.supplierProduct.supplierCode ?? this.supplierProduct.code,
      lastImportedPrice: this.supplierProduct.price,
    }).subscribe({
      next: () => {
        this.linking = false;
        this.linked.emit();
      },
      error: (err) => {
        this.linking = false;
        this.errorMessage = err?.error?.message ?? 'Error al vincular el artículo.';
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private reset(): void {
    this.searchTerm = '';
    this.products = [];
    this.selectedProduct = null;
    this.loading = false;
    this.linking = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
