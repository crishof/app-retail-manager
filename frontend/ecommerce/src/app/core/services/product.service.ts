import { Injectable, signal, computed, Signal } from '@angular/core';
import { Product, FilterState } from '../models';
import { PRODUCTS } from '../data/mock-data';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _all = signal<Product[]>(PRODUCTS);
  private readonly _filter = signal<Partial<FilterState>>({});
  private readonly _category = signal<string | null>(null);
  private readonly _query = signal<string>('');

  readonly allProducts   = this._all.asReadonly();
  readonly currentCategory = this._category.asReadonly();

  readonly filtered = computed(() => {
    let list = this._all();
    const cat = this._category();
    const q   = this._query().toLowerCase().trim();

    if (cat) list = list.filter(p => p.category === cat);
    if (q)   list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
    );

    const f = this._filter();
    if (f.brands?.length)    list = list.filter(p => f.brands!.includes(p.brand));
    if (f.priceMax)           list = list.filter(p => p.price <= f.priceMax!);
    if (f.ratingMin)          list = list.filter(p => p.rating >= f.ratingMin!);
    if (f.onlyDeals)          list = list.filter(p => p.tags.includes('deal'));
    if (f.onlyOutlet)         list = list.filter(p => p.tags.includes('outlet'));

    return list;
  });

  setCategory(slug: string | null): void {
    this._category.set(slug);
  }

  setQuery(q: string): void {
    this._query.set(q);
  }

  setFilter(f: Partial<FilterState>): void {
    this._filter.set(f);
  }

  getBySlug(slug: string): Product | undefined {
    return this._all().find(p => p.slug === slug);
  }

  getByCategory(cat: string): Product[] {
    return this._all().filter(p => p.category === cat);
  }

  getFeatured(): Product[] {
    return this._all().filter(p => p.tags.includes('featured') || p.tags.includes('deal'));
  }

  getFavorites(ids: Signal<Set<string>>): Signal<Product[]> {
    return computed(() => this._all().filter(p => ids().has(p.id)));
  }

  starsHtml(rating: number): string {
    const full  = Math.round(rating);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
  }
}
