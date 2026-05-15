import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bc-bar">
      <nav class="breadcrumb">
        <a routerLink="/">Inicio</a>
        <span class="sep">›</span>
        <span>Cesta de la compra</span>
      </nav>
      <h1 class="page-title">Tu cesta de la compra</h1>
    </div>

    <div class="cart-layout">

      <!-- ITEMS -->
      <div>
        @if (cartSvc.items().length === 0) {
          <div class="empty-state">
            <span class="e-icon">🛒</span>
            <h3>Tu cesta está vacía</h3>
            <p>Explora el catálogo y encuentra tu próximo instrumento</p>
            <a routerLink="/catalogo" class="btn-primary" style="margin-top:16px;display:inline-block">Ver catálogo</a>
          </div>
        } @else {
          @for (item of cartSvc.items(); track item.id) {
            <div class="cart-item">
              <div class="cart-img">{{ item.emoji }}</div>
              <div class="cart-info">
                <div class="cart-brand">{{ item.brand }}</div>
                <div class="cart-name">{{ item.name }}</div>
                <div class="cart-meta-row">🚚 Entrega 24-48h · 🏆 Garantía 3 años</div>
                <div class="cart-actions">
                  <div class="qty-ctrl" role="group" [attr.aria-label]="'Cantidad de ' + item.name">
                    <button (click)="cartSvc.changeQty(item.id, -1)" aria-label="Disminuir">−</button>
                    <span>{{ item.qty }}</span>
                    <button (click)="cartSvc.changeQty(item.id, 1)" aria-label="Aumentar">+</button>
                  </div>
                  <button class="rm-btn" (click)="cartSvc.remove(item.id)">Eliminar</button>
                  <button class="save-btn" (click)="toastSvc.show('❤️ Guardado en favoritos')">❤️ Guardar</button>
                </div>
              </div>
              <div class="cart-price">
                <div class="item-total">{{ item.price * item.qty | number:'1.2-2' }}€</div>
                @if (item.qty > 1) {
                  <div class="item-unit">{{ item.price | number:'1.0-0' }}€/u</div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- SUMMARY -->
      <div>
        <div class="order-summary">
          <div class="summary-title">Resumen del pedido</div>

          @if (cartSvc.items().length > 0) {
            <div class="sum-rows">
              <div class="sum-row">
                <span>Subtotal ({{ cartSvc.count() }} art.)</span>
                <span>{{ cartSvc.subtotal() | number:'1.2-2' }}€</span>
              </div>
              <div class="sum-row">
                <span>Envío</span>
                <span [class.free]="cartSvc.shipping() === 0">
                  {{ cartSvc.shipping() === 0 ? 'GRATIS' : cartSvc.shipping() + '€' }}
                </span>
              </div>
              <div class="sum-row">
                <span>IVA (21% incl.)</span>
                <span>{{ cartSvc.subtotal() * 0.21 | number:'1.2-2' }}€</span>
              </div>
              <div class="sum-row total">
                <span>TOTAL</span>
                <span>{{ cartSvc.total() | number:'1.2-2' }}€</span>
              </div>
            </div>

            @if (cartSvc.shipping() === 0) {
              <div class="free-shipping-badge">✅ ¡Tienes envío gratuito en este pedido!</div>
            }

            <a routerLink="/checkout" class="checkout-btn">Finalizar compra →</a>
            <div class="secure-note">🔒 Compra 100% segura y cifrada</div>

            <div class="pay-logos">
              @for (m of payMethods; track m) {
                <span class="pay-logo">{{ m }}</span>
              }
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .bc-bar {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -.2px;
      margin-top: 4px;
    }
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 14px;
      align-items: start;
    }
    .cart-item {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 12px;
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      transition: border-color .15s;
    }
    .cart-item:hover { border-color: var(--gray-300); }
    .cart-img {
      width: 72px;
      height: 58px;
      background: var(--line-soft);
      border-radius: var(--r-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
      border: 1px solid var(--line);
    }
    .cart-info { flex: 1; }
    .cart-brand { font-size: 10px; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: .6px; font-family: var(--font-display); margin-bottom: 2px; }
    .cart-name  { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
    .cart-meta-row { font-size: 10px; color: var(--ink-light); margin-bottom: 8px; }
    .cart-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .qty-ctrl {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--line);
      border-radius: var(--r-sm);
      overflow: hidden;
    }
    .qty-ctrl button {
      background: var(--line-soft);
      border: none;
      padding: 4px 9px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
    }
    .qty-ctrl button:hover { background: var(--line); }
    .qty-ctrl span { padding: 4px 11px; font-size: 12.5px; font-weight: 700; min-width: 30px; text-align: center; font-family: var(--font-mono); }
    .rm-btn { font-size: 11px; color: var(--ink-light); cursor: pointer; background: none; border: none; text-decoration: underline; }
    .rm-btn:hover { color: var(--primary); }
    .save-btn { font-size: 11px; color: var(--primary); cursor: pointer; background: none; border: none; }
    .cart-price { text-align: right; flex-shrink: 0; }
    .item-total { font-size: 16px; font-weight: 800; font-family: var(--font-display); }
    .item-unit  { font-size: 10px; color: var(--gray-300); font-family: var(--font-mono); }

    /* SUMMARY */
    .order-summary {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 16px;
      position: sticky;
      top: 100px;
    }
    .summary-title {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .2px;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 8px;
    }
    .sum-rows { margin-bottom: 10px; }
    .sum-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 12.5px;
      border-bottom: 1px solid var(--line-soft);
    }
    .sum-row.total { font-weight: 800; font-size: 15px; border-top: 2px solid var(--line); border-bottom: none; margin-top: 6px; padding-top: 10px; font-family: var(--font-display); }
    .free { color: var(--green); font-weight: 700; }
    .free-shipping-badge { background: var(--green-bg); border: 1px solid #bbf7d0; border-radius: var(--r-sm); padding: 8px 10px; font-size: 11px; color: #166534; margin-bottom: 10px; }
    .checkout-btn {
      display: block;
      width: 100%;
      background: var(--primary);
      color: #fff;
      text-align: center;
      border: none;
      padding: 13px;
      border-radius: var(--r-md);
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      font-family: var(--font-display);
      letter-spacing: .2px;
      transition: background .15s;
      margin-bottom: 8px;
    }
    .checkout-btn:hover { background: var(--primary-dark); }
    .secure-note { font-size: 10px; color: var(--ink-light); text-align: center; margin-bottom: 8px; }

    @media (max-width: 900px) {
      .cart-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class CartComponent {
  protected cartSvc  = inject(CartService);
  protected toastSvc = inject(ToastService);

  readonly payMethods = ['VISA', 'MC', 'AMEX', 'PayPal', 'Aplazame', 'Bizum'];
}
