import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../core/models';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="pcard"
      (click)="goToProduct()"
      [attr.aria-label]="product().brand + ' ' + product().name"
      tabindex="0"
      (keyup.enter)="goToProduct()"
      role="article"
    >
      <!-- Image -->
      <div class="pcard-img">
        <!-- Badges -->
        <div class="pcard-badges">
          @if (product().tags.includes('deal')) {
            <span class="badge badge-deal">Sale</span>
          }
          @if (product().tags.includes('new')) {
            <span class="badge badge-new">New</span>
          }
          @if (product().tags.includes('outlet')) {
            <span class="badge badge-outlet">Outlet</span>
          }
          @if (product().tags.includes('topSeller')) {
            <span class="badge badge-top">Top seller</span>
          }
        </div>
        <!-- Wishlist -->
        <button
          class="fav-btn"
          [class.active]="isFav()"
          (click)="$event.stopPropagation(); toggleFav()"
          [attr.aria-label]="isFav() ? 'Remove from wishlist' : 'Add to wishlist'"
          [attr.aria-pressed]="isFav()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               [attr.stroke]="isFav() ? 'none' : 'currentColor'"
               [attr.fill]="isFav() ? 'currentColor' : 'none'"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <!-- Product image placeholder -->
        <div class="pcard-img-inner" aria-hidden="true">
          <span class="pcard-emoji">{{ product().emoji }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="pcard-body">
        <div class="pcard-brand">{{ product().brand }}</div>
        <h3 class="pcard-name">{{ product().name }}</h3>

        <!-- Rating -->
        <div class="pcard-rating">
          <span class="stars" [attr.aria-label]="product().rating + ' out of 5 stars'">{{ stars }}</span>
          <span class="rev-count">({{ product().reviews }})</span>
        </div>

        <!-- Price -->
        <div class="pcard-price">
          <span class="price-now">{{ product().price | number:'1.0-0' }}&nbsp;€</span>
          @if (product().oldPrice) {
            <span class="price-old">{{ product().oldPrice! | number:'1.0-0' }}&nbsp;€</span>
            <span class="price-save">−{{ product().discount }}%</span>
          }
        </div>

        <!-- Stock + delivery -->
        <div class="pcard-meta">
          <span [class]="stockClass">{{ stockLabel }}</span>
          <span class="meta-sep" aria-hidden="true">&middot;</span>
          <span class="delivery-txt">Ships 24–48h</span>
        </div>

        <!-- Add to cart -->
        <button
          class="add-btn"
          [class.out]="product().stock === 'outOfStock'"
          [disabled]="product().stock === 'outOfStock'"
          (click)="$event.stopPropagation(); addToCart()"
          [attr.aria-label]="'Add ' + product().name + ' to cart'"
        >
          @if (product().stock === 'outOfStock') {
            Out of stock
          } @else {
            Add to cart
          }
        </button>
      </div>
    </article>
  `,
  styles: [`
    .pcard {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-xl);
      overflow: hidden;
      cursor: pointer;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      display: flex;
      flex-direction: column;
      outline: none;
    }
    .pcard:hover {
      border-color: var(--gray-300);
      box-shadow: var(--shadow-md);
    }
    .pcard:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    /* Image area */
    .pcard-img {
      position: relative;
      background: var(--gray-50);
      border-bottom: 1px solid var(--gray-100);
      aspect-ratio: 4 / 3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pcard-img-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .pcard-emoji { font-size: 52px; opacity: .7; }

    /* Badges */
    .pcard-badges {
      position: absolute;
      top: 8px;
      left: 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      z-index: 1;
    }

    /* Wishlist button */
    .fav-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-400);
      cursor: pointer;
      transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast);
      z-index: 1;
      box-shadow: var(--shadow-xs);
    }
    .fav-btn:hover { color: var(--red); border-color: var(--red); background: var(--red-bg); }
    .fav-btn.active { color: var(--red); border-color: var(--red); background: var(--red-bg); }

    /* Card body */
    .pcard-body {
      padding: 12px 12px 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .pcard-brand {
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-bottom: 3px;
    }
    .pcard-name {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--gray-900);
      line-height: 1.35;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-family: var(--font-body);
    }
    .pcard-rating {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    /* Price */
    .pcard-price {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .price-now  { font-size: 20px; font-weight: 700; color: var(--gray-900); font-family: var(--font-display); letter-spacing: -.3px; }
    .price-old  { font-size: 13px; color: var(--gray-400); text-decoration: line-through; }
    .price-save {
      font-size: 11px;
      font-weight: 600;
      color: var(--red);
      background: var(--red-bg);
      padding: 1px 5px;
      border-radius: var(--r-sm);
    }

    /* Meta row */
    .pcard-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      margin-bottom: 12px;
      min-height: 16px;
    }
    .stock-in  { color: var(--green);  font-weight: 500; }
    .stock-low { color: var(--orange); font-weight: 500; }
    .stock-out { color: var(--red);    font-weight: 500; }
    .meta-sep  { color: var(--gray-300); }
    .delivery-txt { color: var(--gray-400); }

    /* Add to cart button */
    .add-btn {
      margin-top: auto;
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 9px 12px;
      border-radius: var(--r-lg);
      font-weight: 600;
      font-size: 13px;
      font-family: var(--font-body);
      letter-spacing: -.1px;
      transition: background var(--t-fast);
    }
    .add-btn:hover:not(:disabled) { background: var(--primary-dark); }
    .add-btn.out, .add-btn:disabled {
      background: var(--gray-200);
      color: var(--gray-400);
      cursor: not-allowed;
    }
  `]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();

  private cartSvc  = inject(CartService);
  private favsSvc  = inject(FavoritesService);
  private toastSvc = inject(ToastService);
  private prodSvc  = inject(ProductService);
  private router   = inject(Router);

  isFav(): boolean {
    return this.favsSvc.isFav(this.product().id);
  }

  get stars(): string {
    return this.prodSvc.starsHtml(this.product().rating);
  }

  get stockClass(): string {
    const s = this.product().stock;
    return s === 'inStock' ? 'stock-in' : s === 'lowStock' ? 'stock-low' : 'stock-out';
  }

  get stockLabel(): string {
    const s = this.product().stock;
    return s === 'inStock' ? 'In stock' : s === 'lowStock' ? 'Low stock' : 'Out of stock';
  }

  addToCart(): void {
    this.cartSvc.addProduct(this.product());
    this.toastSvc.show(`Added to cart: ${this.product().name.substring(0, 40)}`);
  }

  toggleFav(): void {
    this.favsSvc.toggle(this.product().id);
    const msg = this.favsSvc.isFav(this.product().id) ? 'Added to wishlist' : 'Removed from wishlist';
    this.toastSvc.show(msg);
  }

  goToProduct(): void {
    this.router.navigate(['/producto', this.product().slug]);
  }
}
