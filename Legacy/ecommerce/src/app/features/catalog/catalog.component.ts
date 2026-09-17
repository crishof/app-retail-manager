import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { CATEGORIES, BRANDS } from '../../core/data/mock-data';
import { Product } from '../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="catalog-layout">

      <!-- SIDEBAR FILTERS -->
      <aside class="sidebar" aria-label="Filtros">

        <!-- Brands -->
        <div class="filter-sec">
          <div class="filter-hdr" (click)="toggleSection('brands')">
            <span>Marcas</span>
            <span class="chevron" [class.open]="openSections['brands']">▾</span>
          </div>
          @if (openSections['brands']) {
            <div class="filter-body">
              <input type="text" class="filter-search" placeholder="Buscar marca..."
                     [(ngModel)]="brandSearch" (input)="filterBrandList()">
              @for (b of visibleBrands; track b.name) {
                <label class="fcheck">
                  <input type="checkbox" [checked]="selectedBrands.has(b.name)"
                         (change)="toggleBrand(b.name)">
                  <span>{{ b.name }}</span>
                  <span class="fcount">{{ b.count }}</span>
                </label>
              }
              @if (brandSearchResults.length > 8) {
                <a class="see-more">+ Ver más marcas</a>
              }
            </div>
          }
        </div>

        <!-- Price -->
        <div class="filter-sec">
          <div class="filter-hdr" (click)="toggleSection('price')">
            <span>Precio (€)</span>
            <span class="chevron" [class.open]="openSections['price']">▾</span>
          </div>
          @if (openSections['price']) {
            <div class="filter-body">
              <input type="range" class="price-range" min="0" max="5000" [(ngModel)]="priceMax">
              <div class="price-range-labels">
                <span>0€</span>
                <span>{{ priceMax | number }}€</span>
              </div>
              <div class="price-inputs">
                <input type="number" placeholder="Desde" value="0" class="form-input">
                <input type="number" placeholder="Hasta" [value]="priceMax" class="form-input">
              </div>
            </div>
          }
        </div>

        <!-- Availability -->
        <div class="filter-sec">
          <div class="filter-hdr" (click)="toggleSection('availability')">
            <span>Disponibilidad</span>
            <span class="chevron" [class.open]="openSections['availability']">▾</span>
          </div>
          @if (openSections['availability']) {
            <div class="filter-body">
              <label class="fcheck"><input type="checkbox" checked> En stock <span class="fcount">3.241</span></label>
              <label class="fcheck"><input type="checkbox"> Entrega inmediata <span class="fcount">1.820</span></label>
              <label class="fcheck"><input type="checkbox"> Disponible pronto <span class="fcount">412</span></label>
            </div>
          }
        </div>

        <!-- Rating -->
        <div class="filter-sec">
          <div class="filter-hdr" (click)="toggleSection('rating')">
            <span>Valoración</span>
            <span class="chevron" [class.open]="openSections['rating']">▾</span>
          </div>
          @if (openSections['rating']) {
            <div class="filter-body">
              <label class="fcheck"><input type="checkbox"> ★★★★★ (4.8+) <span class="fcount">184</span></label>
              <label class="fcheck"><input type="checkbox"> ★★★★☆ (4.0+) <span class="fcount">1.242</span></label>
              <label class="fcheck"><input type="checkbox"> ★★★☆☆ (3.0+) <span class="fcount">2.108</span></label>
            </div>
          }
        </div>

        <!-- Deals -->
        <div class="filter-sec">
          <div class="filter-hdr" (click)="toggleSection('features')">
            <span>Características</span>
            <span class="chevron" [class.open]="openSections['features']">▾</span>
          </div>
          @if (openSections['features']) {
            <div class="filter-body">
              <label class="fcheck"><input type="checkbox" [(ngModel)]="onlyDeals"> Solo ofertas <span class="fcount">842</span></label>
              <label class="fcheck"><input type="checkbox"> Para zurdos <span class="fcount">148</span></label>
              <label class="fcheck"><input type="checkbox" [(ngModel)]="onlyOutlet"> Outlet / Ex-demo <span class="fcount">214</span></label>
            </div>
          }
        </div>

        <button class="apply-btn" (click)="applyFilters()">Aplicar filtros</button>
        <span class="reset-lnk" (click)="resetFilters()">Restablecer todos</span>
      </aside>

      <!-- CONTENT -->
      <div class="cat-content">

        <!-- HEADER -->
        <div class="cat-header">
          <nav class="breadcrumb" aria-label="Navegación">
            <a routerLink="/">Inicio</a>
            <span class="sep">›</span>
            <span>{{ categoryName() }}</span>
          </nav>
          <div class="cat-title-bar">
            <div>
              <h1 class="cat-title">{{ categoryName() }}</h1>
              <div class="cat-meta">{{ products().length | number }} artículos encontrados · Mostrando 1–{{ products().length }}</div>
            </div>
          </div>
          <div class="toolbar">
            <label class="sort-label">Ordenar:</label>
            <select class="sort-sel" [(ngModel)]="sortBy" (change)="sortProducts()">
              <option value="recommended">Recomendados</option>
              <option value="price-asc">Precio: menor → mayor</option>
              <option value="price-desc">Precio: mayor → menor</option>
              <option value="rating">Más valorados</option>
              <option value="name">Nombre A-Z</option>
            </select>
            <div class="view-toggle" role="group" aria-label="Tipo de vista">
              <button class="view-btn" [class.active]="viewMode() === 'grid'"
                      (click)="viewMode.set('grid')" aria-label="Vista cuadrícula">⊞</button>
              <button class="view-btn" [class.active]="viewMode() === 'list'"
                      (click)="viewMode.set('list')" aria-label="Vista lista">☰</button>
            </div>
            <select class="pp-sel">
              <option>24 por página</option>
              <option>48 por página</option>
              <option>96 por página</option>
            </select>
          </div>
        </div>

        <!-- GRID -->
        <div class="products-grid" [class.list-view]="viewMode() === 'list'">
          @for (p of products(); track p.id) {
            <app-product-card [product]="p" />
          }
          @if (!products().length) {
            <div class="empty-state" style="grid-column: 1 / -1">
              <span class="e-icon">🔍</span>
              <h3>No se encontraron productos</h3>
              <p>Prueba a cambiar los filtros o busca otro término</p>
            </div>
          }
        </div>

        <!-- PAGINATION -->
        <div class="pagination">
          <button class="page-btn">‹</button>
          @for (page of [1,2,3,4,5]; track page) {
            <button class="page-btn" [class.active]="page === 1"
                    (click)="toastSvc.show('Página ' + page)">{{ page }}</button>
          }
          <span class="page-ellipsis">...</span>
          <button class="page-btn" (click)="toastSvc.show('Página 178')">178</button>
          <button class="page-btn">›</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .catalog-layout {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    /* SIDEBAR */
    .sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 100px; align-self: flex-start; max-height: calc(100vh - 110px); overflow-y: auto; scrollbar-width: thin; }
    .filter-sec {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      margin-bottom: 8px;
      overflow: hidden;
    }
    .filter-hdr {
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 800;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background: var(--line-soft);
      user-select: none;
      font-family: var(--font-display);
      text-transform: uppercase;
      letter-spacing: .2px;
    }
    .filter-hdr:hover { background: var(--line); }
    .chevron { transition: transform .2s; display: inline-block; }
    .chevron.open { transform: rotate(180deg); }
    .filter-body { padding: 10px 12px; }
    .filter-search {
      width: 100%;
      border: 1.5px solid var(--line);
      padding: 5px 8px;
      border-radius: var(--r-sm);
      font-size: 11px;
      margin-bottom: 8px;
      outline: none;
    }
    .filter-search:focus { border-color: var(--primary); }
    .fcheck {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      font-size: 11px;
      cursor: pointer;
      user-select: none;
    }
    .fcheck input[type=checkbox] { accent-color: var(--primary); }
    .fcount { margin-left: auto; font-size: 10px; color: var(--ink-light); font-family: var(--font-mono); }
    .see-more { font-size: 10px; color: var(--primary); display: block; margin-top: 6px; cursor: pointer; }
    .price-range {
      width: 100%;
      accent-color: var(--primary);
      margin: 8px 0;
      cursor: pointer;
    }
    .price-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-light); margin-bottom: 6px; font-family: var(--font-mono); }
    .price-inputs { display: flex; gap: 6px; }
    .price-inputs .form-input { padding: 5px 7px; font-size: 11px; }
    .apply-btn {
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 8px;
      border-radius: var(--r-md);
      font-weight: 800;
      font-size: 11.5px;
      cursor: pointer;
      font-family: var(--font-display);
      text-transform: uppercase;
      letter-spacing: .2px;
    }
    .apply-btn:hover { background: var(--primary-dark); }
    .reset-lnk { display: block; text-align: center; margin-top: 7px; font-size: 10.5px; color: var(--ink-muted); cursor: pointer; text-decoration: underline; }

    /* CONTENT */
    .cat-content { flex: 1; min-width: 0; }
    .cat-header {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .cat-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -.2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .cat-meta { font-size: 11px; color: var(--ink-light); font-family: var(--font-mono); }
    .cat-title-bar { margin-bottom: 8px; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sort-label { font-size: 11px; color: var(--ink-muted); }
    .sort-sel {
      border: 1.5px solid var(--line);
      padding: 5px 8px;
      border-radius: var(--r-md);
      font-size: 11.5px;
      outline: none;
      font-family: var(--font-body);
      background: var(--surface);
    }
    .view-toggle { display: flex; gap: 2px; }
    .view-btn {
      background: var(--line-soft);
      border: 1.5px solid var(--line);
      padding: 4px 9px;
      border-radius: var(--r-sm);
      cursor: pointer;
      font-size: 13px;
      transition: all .12s;
    }
    .view-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
    .pp-sel {
      border: 1.5px solid var(--line);
      padding: 4px 7px;
      border-radius: var(--r-md);
      font-size: 11px;
      outline: none;
      font-family: var(--font-body);
      background: var(--surface);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .products-grid.list-view { grid-template-columns: 1fr; }
    .page-ellipsis { padding: 0 4px; font-size: 12px; color: var(--ink-light); }

    @media (max-width: 900px) {
      .catalog-layout { flex-direction: column; }
      .sidebar { width: 100%; position: static; max-height: none; }
      .products-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 500px) {
      .products-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CatalogComponent implements OnInit {
  protected toastSvc = inject(ToastService);
  private productSvc = inject(ProductService);
  private route      = inject(ActivatedRoute);

  readonly viewMode  = signal<'grid' | 'list'>('grid');
  readonly products  = signal<Product[]>([]);
  readonly categoryName = signal<string>('Catálogo');

  // Filter state
  selectedBrands   = new Set<string>();
  priceMax         = 5000;
  onlyDeals        = false;
  onlyOutlet       = false;
  sortBy           = 'recommended';
  brandSearch      = '';
  brandSearchResults = [...BRANDS];
  visibleBrands    = BRANDS.slice(0, 8);
  openSections: Record<string, boolean> = { brands: true, price: true, availability: true, rating: false, features: false };

  readonly categories = CATEGORIES;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        const cat = CATEGORIES.find(c => c.slug === slug);
        this.categoryName.set(cat?.name || 'Catálogo');
        this.productSvc.setCategory(slug);
      } else {
        this.categoryName.set('Catálogo');
        this.productSvc.setCategory(null);
      }
      this.products.set(this.productSvc.filtered());
    });
  }

  toggleSection(key: string): void {
    this.openSections[key] = !this.openSections[key];
  }

  toggleBrand(name: string): void {
    if (this.selectedBrands.has(name)) this.selectedBrands.delete(name);
    else this.selectedBrands.add(name);
  }

  filterBrandList(): void {
    const q = this.brandSearch.toLowerCase();
    this.brandSearchResults = BRANDS.filter(b => b.name.toLowerCase().includes(q));
    this.visibleBrands = this.brandSearchResults.slice(0, 8);
  }

  applyFilters(): void {
    this.productSvc.setFilter({
      brands:    this.selectedBrands.size ? [...this.selectedBrands] : undefined,
      priceMax:  this.priceMax,
      onlyDeals: this.onlyDeals,
      onlyOutlet: this.onlyOutlet,
    });
    this.products.set(this.productSvc.filtered());
    this.toastSvc.show(`✅ Filtros aplicados — ${this.products().length} resultados`);
  }

  resetFilters(): void {
    this.selectedBrands.clear();
    this.priceMax = 5000;
    this.onlyDeals = false;
    this.onlyOutlet = false;
    this.productSvc.setFilter({});
    this.products.set(this.productSvc.filtered());
    this.toastSvc.show('Filtros restablecidos');
  }

  sortProducts(): void {
    const list = [...this.products()];
    switch (this.sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    this.products.set(list);
  }
}
