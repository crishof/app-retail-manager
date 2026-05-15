import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'rm_cart';

  private _items = signal<CartItem[]>(this.loadFromStorage());

  readonly items  = this._items.asReadonly();
  readonly count  = computed(() => this._items().reduce((a, i) => a + i.qty, 0));
  readonly subtotal = computed(() => this._items().reduce((a, i) => a + i.price * i.qty, 0));
  readonly shipping = computed(() => this.subtotal() >= 49 ? 0 : 9.99);
  readonly total    = computed(() => Math.round((this.subtotal() + this.shipping()) * 100) / 100);

  private loadFromStorage(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._items()));
  }

  addProduct(product: Pick<Product, 'id' | 'name' | 'brand' | 'price' | 'emoji'>): void {
    this._items.update(items => {
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        return items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...items, { ...product, qty: 1 }];
    });
    this.save();
  }

  remove(id: string): void {
    this._items.update(items => items.filter(i => i.id !== id));
    this.save();
  }

  changeQty(id: string, delta: number): void {
    this._items.update(items => {
      const item = items.find(i => i.id === id);
      if (!item) return items;
      if (item.qty + delta <= 0) return items.filter(i => i.id !== id);
      return items.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i);
    });
    this.save();
  }

  clear(): void {
    this._items.set([]);
    this.save();
  }
}
