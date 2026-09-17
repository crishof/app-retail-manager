import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CATEGORIES } from '../../../core/data/mock-data';

@Component({
  selector: 'app-megamenu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="megamenu" role="navigation" aria-label="Product categories">
      <div class="megamenu-inner">
        @for (cat of categories; track cat.slug) {
          <button
            class="mm-item"
            [class.active]="currentCat() === cat.slug"
            (click)="navigate(cat.slug)"
            [attr.aria-current]="currentCat() === cat.slug ? 'page' : null"
          >{{ cat.name }}</button>
        }
        <div class="mm-sep" aria-hidden="true"></div>
        <button class="mm-item mm-promo" (click)="router.navigate(['/marcas'])">Brands</button>
        <button class="mm-item mm-promo" (click)="router.navigate(['/noticias'])">News</button>
        <button class="mm-item mm-sale" (click)="router.navigate(['/catalogo'])">Outlet</button>
      </div>
    </nav>
  `,
  styles: [`
    .megamenu {
      background: var(--surface);
      border-bottom: 1px solid var(--gray-200);
      position: sticky;
      top: 64px;
      z-index: 190;
    }
    .megamenu-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 var(--gutter);
      display: flex;
      align-items: stretch;
      overflow-x: auto;
      scrollbar-width: none;
      gap: 0;
    }
    .megamenu-inner::-webkit-scrollbar { display: none; }

    .mm-item {
      display: inline-flex;
      align-items: center;
      color: var(--gray-600);
      padding: 0 12px;
      height: 38px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: color var(--t-fast), background var(--t-fast);
      font-family: var(--font-body);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .mm-item:hover {
      color: var(--gray-900);
      background: var(--gray-50);
    }
    .mm-item.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    .mm-sep {
      width: 1px;
      background: var(--gray-200);
      margin: 8px 6px;
      flex-shrink: 0;
    }
    .mm-promo {
      color: var(--gray-500);
      font-size: 12.5px;
    }
    .mm-sale {
      color: var(--red);
      font-weight: 600;
      font-size: 12.5px;
      margin-left: auto;
    }
    .mm-sale:hover { background: var(--red-bg); color: var(--red-dark); }

    @media (max-width: 900px) {
      .megamenu { top: 64px; }
    }
  `]
})
export class MegamenuComponent {
  protected router   = inject(Router);
  private productSvc = inject(ProductService);

  readonly categories = CATEGORIES;
  readonly currentCat = this.productSvc.currentCategory;
  readonly hovered    = signal<string | null>(null);

  navigate(slug: string): void {
    this.productSvc.setCategory(slug);
    this.router.navigate(['/catalogo', slug]);
  }
}
