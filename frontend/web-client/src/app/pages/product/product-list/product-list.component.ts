import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IProduct } from '../../../model/product.model';
import { IStock } from '../../../model/stock.model';
import { PriceAlertsWithHistoryComponent } from '../../../shared/price-alerts-with-history/price-alerts-with-history.component';

type ProductColumnKey =
  | 'id'
  | 'code'
  | 'brand'
  | 'model'
  | 'description'
  | 'category'
  | 'tax'
  | 'price'
  | 'stock';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PriceAlertsWithHistoryComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  @Input() productList: IProduct[] = [];
  @Input() selectedProductId: string | null = null;
  @Input() selectionMode: 'click' | 'dblclick' = 'click';
  @Input() visibleColumns: ProductColumnKey[] = [
    'id',
    'code',
    'brand',
    'model',
    'description',
    'category',
    'tax',
    'price',
    'stock',
  ];
  @Output() selectProduct = new EventEmitter<IProduct>();
  @Output() openInvoiceForProduct = new EventEmitter<IProduct>();

  trackByProductId(_: number, p: IProduct): string { return p.id; }

  onProductInteract(product: IProduct): void {
    this.selectProduct.emit(product);
  }

  onProductDoubleClick(product: IProduct): void {
    this.openInvoiceForProduct.emit(product);
  }

  isColumnVisible(column: ProductColumnKey): boolean {
    return this.visibleColumns.includes(column);
  }

  getTotalStock(stocks: IStock[]): number {
    return stocks?.reduce((acc, s) => acc + s.quantity, 0) ?? 0;
  }

  stockStatus(stocks: IStock[]): 'ok' | 'low' | 'out' {
    const qty = this.getTotalStock(stocks);
    if (qty <= 0) return 'out';
    const min = stocks?.[0]?.min ?? 0;
    return qty <= min ? 'low' : 'ok';
  }
}
