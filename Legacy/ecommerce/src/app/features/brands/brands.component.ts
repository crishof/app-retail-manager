import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRANDS, PRODUCTS } from '../../core/data/mock-data';
import { Brand } from '../../core/models';

@Component({
  selector: 'app-brands',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="brands-page">
      <!-- Header -->
      <div class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Inicio</a>
          <span class="bc-sep">›</span>
          <span>Marcas</span>
        </nav>
        <h1 class="page-title">Todas las marcas</h1>
        <p class="page-sub">{{ brands.length }} marcas · {{ totalProducts().toLocaleString('es-ES') }} productos</p>
      </div>

      <!-- Search -->
      <div class="brands-search">
        <input
          class="search-input"
          type="search"
          placeholder="Buscar marca..."
          [value]="query()"
          (input)="onSearch($event)"
          aria-label="Buscar marca"
        >
      </div>

      <!-- Alphabet filter -->
      <div class="alpha-bar" role="navigation" aria-label="Filtrar por letra">
        <button
          class="alpha-btn"
          [class.active]="activeLetter() === ''"
          (click)="activeLetter.set('')"
        >Todos</button>
        @for (l of alphabet; track l) {
          <button
            class="alpha-btn"
            [class.active]="activeLetter() === l"
            (click)="activeLetter.set(l)"
          >{{ l }}</button>
        }
      </div>

      <!-- Grid -->
      <div class="brands-grid" role="list" aria-label="Lista de marcas">
        @for (brand of filteredBrands(); track brand.name) {
          <a
            class="brand-card"
            [routerLink]="['/catalogo']"
            [queryParams]="{ brand: brand.name }"
            role="listitem"
            [attr.aria-label]="brand.name + ', ' + brand.count + ' productos'"
          >
            <span class="brand-emoji" aria-hidden="true">{{ brand.emoji }}</span>
            <div class="brand-name">{{ brand.name }}</div>
            <div class="brand-count">{{ brand.count }} productos</div>
          </a>
        }
        @if (filteredBrands().length === 0) {
          <p class="no-results">No se encontraron marcas para "{{ query() }}".</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .brands-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px;
      font-family: var(--font-body);
    }
    .breadcrumb {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .breadcrumb a { color: #9ca3af; text-decoration: none; }
    .breadcrumb a:hover { color: var(--c-red, #dc2626); }
    .bc-sep { opacity: .5; }
    .page-header { margin-bottom: 20px; }
    .page-title {
      font-family: var(--font-display, 'Barlow Condensed');
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: -.5px;
    }
    .page-sub { font-size: 13px; color: #6b7280; margin: 0; }

    .brands-search {
      margin-bottom: 16px;
    }
    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 9px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--font-body);
      outline: none;
    }
    .search-input:focus { border-color: var(--c-red, #dc2626); }

    .alpha-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 20px;
    }
    .alpha-btn {
      padding: 4px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .alpha-btn:hover { border-color: var(--c-red, #dc2626); color: var(--c-red, #dc2626); }
    .alpha-btn.active { background: var(--c-red, #dc2626); color: #fff; border-color: var(--c-red, #dc2626); }

    .brands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .brand-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      text-decoration: none;
      color: inherit;
      transition: border-color .15s, transform .15s, box-shadow .15s;
      text-align: center;
    }
    .brand-card:hover {
      border-color: var(--c-red, #dc2626);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .brand-emoji { font-size: 28px; margin-bottom: 6px; }
    .brand-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .brand-count { font-size: 11px; color: #9ca3af; }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      padding: 32px;
    }
  `]
})
export class BrandsComponent implements OnInit {
  readonly brands: Brand[] = BRANDS;
  readonly query = signal('');
  readonly activeLetter = signal('');

  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  readonly totalProducts = computed(() =>
    this.brands.reduce((a, b) => a + (b.count ?? 0), 0)
  );

  readonly filteredBrands = computed(() => {
    let list = this.brands;
    const q = this.query().trim().toLowerCase();
    const l = this.activeLetter();
    if (q) list = list.filter(b => b.name.toLowerCase().includes(q));
    if (l) list = list.filter(b => b.name.toUpperCase().startsWith(l));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit(): void {}

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
