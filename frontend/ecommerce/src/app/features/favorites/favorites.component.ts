import {
  Component, ChangeDetectionStrategy, inject, OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProductService } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCardComponent],
  template: `
    <div class="fav-page">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/">Inicio</a>
        <span class="bc-sep">›</span>
        <span>Favoritos</span>
      </nav>

      <div class="fav-header">
        <h1 class="page-title">Mis favoritos</h1>
        <span class="fav-count" aria-live="polite">
          {{ favoriteProducts().length }} {{ favoriteProducts().length === 1 ? 'producto' : 'productos' }}
        </span>
      </div>

      @if (favoriteProducts().length > 0) {
        <div class="fav-grid" role="list" aria-label="Productos favoritos">
          @for (product of favoriteProducts(); track product.id) {
            <div role="listitem">
              <app-product-card [product]="product" />
            </div>
          }
        </div>
      } @else {
        <div class="empty-state" role="status" aria-label="Sin favoritos">
          <div class="empty-icon" aria-hidden="true">🤍</div>
          <h2 class="empty-title">Aún no tienes favoritos</h2>
          <p class="empty-msg">Guarda los productos que te interesan para encontrarlos fácilmente.</p>
          <a routerLink="/catalogo" class="btn-browse">Ver catálogo →</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .fav-page {
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
    .fav-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 20px;
    }
    .page-title {
      font-family: var(--font-display, 'Barlow Condensed');
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: -.5px;
    }
    .fav-count { font-size: 13px; color: #6b7280; }

    .fav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }
    .empty-icon { font-size: 56px; margin-bottom: 16px; }
    .empty-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px;
      font-family: var(--font-display, 'Barlow Condensed');
    }
    .empty-msg { font-size: 13px; color: #6b7280; margin: 0 0 20px; }
    .btn-browse {
      display: inline-block;
      background: var(--c-red, #dc2626);
      color: #fff;
      text-decoration: none;
      padding: 10px 24px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
    }
    .btn-browse:hover { background: #b91c1c; }
  `]
})
export class FavoritesComponent implements OnInit {
  private favSvc = inject(FavoritesService);
  private productSvc = inject(ProductService);

  readonly favoriteProducts = this.productSvc.getFavorites(this.favSvc.favs);

  ngOnInit(): void {}
}
