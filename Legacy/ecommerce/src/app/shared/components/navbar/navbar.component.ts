import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe],
  template: `
    <header class="navbar" role="banner">
      <div class="navbar-inner">

        <!-- LOGO -->
        <a class="logo" routerLink="/" [attr.aria-label]="tenant().name + ' — Inicio'">
          <div class="logo-mark" aria-hidden="true">R</div>
          <div class="logo-text">
            <span class="logo-name">{{ tenant().name }}</span>
            <span class="logo-sub">Musical Instruments</span>
          </div>
        </a>

        <!-- SEARCH -->
        <div class="search-container" role="search">
          <div class="search-inner">
            <select class="search-cat" aria-label="Categoría de búsqueda">
              <option>All departments</option>
              <option>Guitars</option>
              <option>Bass</option>
              <option>Keyboards</option>
              <option>Drums</option>
              <option>Studio</option>
              <option>DJ</option>
            </select>
            <div class="search-div" aria-hidden="true"></div>
            <input
              #searchInput
              type="search"
              class="search-input"
              placeholder="Search products, brands, SKU…"
              autocomplete="off"
              (input)="onSearchInput(searchInput.value)"
              (keyup.enter)="onSearchEnter(searchInput.value)"
              aria-label="Search products"
            />
            <button
              class="search-btn"
              (click)="onSearchEnter(searchInput.value)"
              aria-label="Search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                   aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ACTIONS -->
        <nav class="nav-actions" aria-label="User actions">

          <a class="nav-btn" routerLink="/ayuda" aria-label="Customer service">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.18v.74z"/>
            </svg>
            <span class="nav-lbl">Soporte</span>
          </a>

          <a class="nav-btn" routerLink="/cuenta" aria-label="My account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span class="nav-lbl">Mi cuenta</span>
          </a>

          <a class="nav-btn" routerLink="/favoritos" aria-label="Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="nav-lbl">Wishlist</span>
          </a>

          <a class="nav-btn nav-cart-btn" routerLink="/carrito"
             [class.has-items]="cartCount() > 0"
             [attr.aria-label]="'Cart, ' + cartCount() + ' items'">
            <div class="cart-wrap" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              @if (cartCount() > 0) {
                <span class="cart-badge" aria-hidden="true">{{ cartCount() }}</span>
              }
            </div>
            <div class="cart-text">
              <span class="nav-lbl">Cesta</span>
              @if (cartCount() > 0) {
                <span class="cart-total">{{ cartTotal() | number:'1.2-2' }}&nbsp;€</span>
              }
            </div>
          </a>

        </nav>

      </div>
    </header>
  `,
  styles: [`
    :host { display: block; position: sticky; top: 0; z-index: 200; }

    .navbar {
      background: var(--surface);
      border-bottom: 1px solid var(--gray-200);
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .navbar-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 var(--gutter);
      height: 64px;
      display: grid;
      grid-template-columns: 210px 1fr auto;
      align-items: center;
      gap: 20px;
    }

    /* LOGO */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      min-width: 0;
    }
    .logo-mark {
      width: 34px; height: 34px;
      background: var(--primary);
      border-radius: var(--r-lg);
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      flex-shrink: 0;
      font-family: var(--font-display);
      letter-spacing: -.5px;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      min-width: 0;
    }
    .logo-name {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 15px;
      color: var(--gray-900);
      letter-spacing: -.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logo-sub {
      font-size: 9.5px;
      color: var(--gray-400);
      font-weight: 400;
      letter-spacing: .1px;
    }

    /* SEARCH */
    .search-container { width: 100%; }
    .search-inner {
      display: flex;
      align-items: stretch;
      border: 1.5px solid var(--gray-300);
      border-radius: var(--r-xl);
      overflow: hidden;
      background: var(--surface);
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      height: 40px;
    }
    .search-inner:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26,107,58,.10);
    }
    .search-cat {
      border: none;
      border-right: 1px solid var(--gray-200);
      padding: 0 10px;
      font-size: 12px;
      font-weight: 500;
      color: var(--gray-600);
      background: var(--gray-50);
      outline: none;
      cursor: pointer;
      min-width: 100px;
      flex-shrink: 0;
    }
    .search-cat:hover { background: var(--gray-100); }
    .search-div { width: 1px; background: var(--gray-200); flex-shrink: 0; }
    .search-input {
      flex: 1;
      border: none;
      padding: 0 14px;
      font-size: 13.5px;
      outline: none;
      color: var(--gray-900);
      background: transparent;
      min-width: 0;
    }
    .search-input::placeholder { color: var(--gray-400); }
    .search-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 0 18px;
      display: flex; align-items: center; justify-content: center;
      transition: background var(--t-fast);
      flex-shrink: 0;
    }
    .search-btn:hover { background: var(--primary-dark); }

    /* ACTIONS */
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .nav-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: var(--r-xl);
      text-decoration: none;
      color: var(--gray-600);
      transition: background var(--t-fast), color var(--t-fast);
      white-space: nowrap;
    }
    .nav-btn:hover { background: var(--gray-100); color: var(--gray-900); }
    .nav-lbl {
      font-size: 12px;
      font-weight: 500;
      color: inherit;
    }

    /* CART */
    .nav-cart-btn { gap: 8px; }
    .cart-wrap { position: relative; display: flex; align-items: center; }
    .cart-badge {
      position: absolute;
      top: -7px; right: -8px;
      background: var(--red);
      color: #fff;
      border-radius: 10px;
      font-size: 9px; font-weight: 700;
      padding: 1px 4px;
      min-width: 16px; text-align: center;
      line-height: 1.4;
      border: 1.5px solid var(--surface);
    }
    .cart-text { display: flex; flex-direction: column; line-height: 1.2; }
    .cart-total { font-size: 11px; font-weight: 700; color: var(--primary); }
    .has-items svg { stroke: var(--gray-900); }
    .has-items .nav-lbl { color: var(--gray-900); font-weight: 600; }

    @media (max-width: 1100px) {
      .navbar-inner { grid-template-columns: 180px 1fr auto; gap: 14px; }
      .nav-lbl { display: none; }
      .nav-btn { padding: 7px; }
      .cart-text { display: none; }
    }
    @media (max-width: 768px) {
      .navbar-inner { grid-template-columns: 44px 1fr auto; }
      .logo-text { display: none; }
    }
    @media (max-width: 480px) {
      .search-cat { display: none; }
    }
  `]
})
export class NavbarComponent {
  private cartSvc    = inject(CartService);
  private favSvc     = inject(FavoritesService);
  private tenantSvc  = inject(TenantService);
  private productSvc = inject(ProductService);
  private router     = inject(Router);

  readonly cartCount = this.cartSvc.count;
  readonly cartTotal = this.cartSvc.total;
  readonly tenant    = this.tenantSvc.current;

  onSearchInput(value: string): void {
    this.productSvc.setQuery(value);
  }

  onSearchEnter(value: string): void {
    if (value.trim()) {
      this.productSvc.setQuery(value);
      this.router.navigate(['/catalogo']);
    }
  }
}
