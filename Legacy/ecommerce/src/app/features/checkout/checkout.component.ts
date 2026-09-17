import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

interface ShippingOption {
  id: string;
  icon: string;
  name: string;
  desc: string;
  price: number;
}

interface PaymentOption {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="checkout-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/">Inicio</a>
        <span class="bc-sep">›</span>
        <a routerLink="/carrito">Carrito</a>
        <span class="bc-sep">›</span>
        <span>Checkout</span>
      </nav>

      @if (confirmed()) {
        <!-- Order confirmed screen -->
        <div class="confirm-screen">
          <div class="confirm-icon">✅</div>
          <h1 class="confirm-title">¡Pedido confirmado!</h1>
          <p class="confirm-order">N.º de pedido: <strong>#RM-2025-48291</strong></p>
          <p class="confirm-msg">
            Recibirás un email de confirmación en<br>
            <strong>{{ addressForm.value.email }}</strong>
          </p>
          <p class="confirm-delivery">
            Entrega estimada: <strong>lunes 19 mayo 2025</strong>
          </p>
          <div class="confirm-actions">
            <a routerLink="/" class="btn-primary">🏠 Volver al inicio</a>
            <a routerLink="/pedidos" class="btn-outline">📦 Ver mis pedidos</a>
          </div>
        </div>
      } @else {
        <div class="checkout-layout">
          <!-- Left: steps -->
          <div class="checkout-main">
            <!-- Steps bar -->
            <div class="steps-bar" role="list" aria-label="Pasos del checkout">
              @for (s of steps; track s.n) {
                <div
                  class="step"
                  [class.done]="currentStep() > s.n"
                  [class.current]="currentStep() === s.n"
                  role="listitem"
                  [attr.aria-current]="currentStep() === s.n ? 'step' : null"
                >
                  <div class="step-num" aria-hidden="true">
                    {{ currentStep() > s.n ? '✓' : s.n }}
                  </div>
                  <span>{{ s.label }}</span>
                </div>
              }
            </div>

            <!-- Step 1: Contact & Address -->
            @if (currentStep() === 1) {
              <section class="step-panel" aria-labelledby="step1-title">
                <h2 id="step1-title" class="step-title">
                  <span class="step-badge">1</span> Datos de contacto y entrega
                </h2>
                <form [formGroup]="addressForm" (ngSubmit)="goToStep(2)" novalidate>
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label" for="firstName">Nombre *</label>
                      <input id="firstName" class="form-input" formControlName="firstName"
                        [class.invalid]="isInvalid('firstName')" autocomplete="given-name">
                      @if (isInvalid('firstName')) {
                        <span class="field-error">Campo requerido</span>
                      }
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="lastName">Apellidos *</label>
                      <input id="lastName" class="form-input" formControlName="lastName"
                        [class.invalid]="isInvalid('lastName')" autocomplete="family-name">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="email">Email *</label>
                    <input id="email" class="form-input" type="email" formControlName="email"
                      [class.invalid]="isInvalid('email')" autocomplete="email">
                    @if (isInvalid('email')) {
                      <span class="field-error">Email no válido</span>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="phone">Teléfono *</label>
                    <input id="phone" class="form-input" type="tel" formControlName="phone"
                      autocomplete="tel">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="address">Dirección completa *</label>
                    <input id="address" class="form-input" formControlName="address"
                      [class.invalid]="isInvalid('address')" autocomplete="street-address">
                  </div>
                  <div class="form-grid-3">
                    <div class="form-group">
                      <label class="form-label" for="city">Ciudad</label>
                      <input id="city" class="form-input" formControlName="city" autocomplete="address-level2">
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="zip">Código postal</label>
                      <input id="zip" class="form-input" formControlName="zip" autocomplete="postal-code">
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="country">País</label>
                      <select id="country" class="form-input" formControlName="country" autocomplete="country-name">
                        <option>España</option>
                        <option>Portugal</option>
                        <option>Francia</option>
                        <option>Alemania</option>
                        <option>Italia</option>
                      </select>
                    </div>
                  </div>
                  <div class="step-nav step-nav-end">
                    <button type="submit" class="btn-next"
                      [disabled]="addressForm.invalid">
                      Continuar → Envío
                    </button>
                  </div>
                </form>
              </section>
            }

            <!-- Step 2: Shipping -->
            @if (currentStep() === 2) {
              <section class="step-panel" aria-labelledby="step2-title">
                <h2 id="step2-title" class="step-title">
                  <span class="step-badge">2</span> Método de envío
                </h2>
                <div class="ship-options" role="radiogroup" aria-label="Opciones de envío">
                  @for (opt of shippingOptions; track opt.id) {
                    <label class="ship-opt" [class.sel]="selectedShipping() === opt.id">
                      <input type="radio" name="ship" [value]="opt.id"
                        [checked]="selectedShipping() === opt.id"
                        (change)="selectedShipping.set(opt.id)">
                      <span class="ship-icon" aria-hidden="true">{{ opt.icon }}</span>
                      <div class="ship-info">
                        <div class="ship-name">{{ opt.name }}</div>
                        <div class="ship-desc">{{ opt.desc }}</div>
                      </div>
                      <div class="ship-price" [class.free]="opt.price === 0">
                        {{ opt.price === 0 ? 'GRATIS' : opt.price.toFixed(2) + '€' }}
                      </div>
                    </label>
                  }
                </div>
                <div class="step-nav">
                  <button type="button" class="btn-back" (click)="goToStep(1)">← Volver</button>
                  <button type="button" class="btn-next" (click)="goToStep(3)">Continuar → Pago</button>
                </div>
              </section>
            }

            <!-- Step 3: Payment -->
            @if (currentStep() === 3) {
              <section class="step-panel" aria-labelledby="step3-title">
                <h2 id="step3-title" class="step-title">
                  <span class="step-badge">3</span> Método de pago
                </h2>
                <div class="pay-options" role="radiogroup" aria-label="Métodos de pago">
                  @for (opt of paymentOptions; track opt.id) {
                    <label class="pay-opt" [class.sel]="selectedPayment() === opt.id">
                      <input type="radio" name="pay" [value]="opt.id"
                        [checked]="selectedPayment() === opt.id"
                        (change)="selectedPayment.set(opt.id)">
                      <span class="pay-icon" aria-hidden="true">{{ opt.icon }}</span>
                      <div class="pay-info">
                        <div class="pay-name">{{ opt.name }}</div>
                        <div class="pay-desc">{{ opt.desc }}</div>
                      </div>
                    </label>
                  }
                </div>

                @if (selectedPayment() === 'card') {
                  <div class="card-form" aria-label="Datos de tarjeta">
                    <div class="form-group">
                      <label class="form-label" for="cardNum">Número de tarjeta</label>
                      <input id="cardNum" class="form-input" placeholder="1234 5678 9012 3456"
                        [formControl]="cardForm.controls.number" maxlength="19" autocomplete="cc-number">
                    </div>
                    <div class="form-grid-3">
                      <div class="form-group">
                        <label class="form-label" for="cardExp">Caducidad</label>
                        <input id="cardExp" class="form-input" placeholder="MM/AA"
                          [formControl]="cardForm.controls.expiry" maxlength="5" autocomplete="cc-exp">
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="cardCvv">CVV</label>
                        <input id="cardCvv" class="form-input" placeholder="123"
                          [formControl]="cardForm.controls.cvv" maxlength="4" autocomplete="cc-csc">
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="cardHolder">Titular</label>
                        <input id="cardHolder" class="form-input" placeholder="Nombre"
                          [formControl]="cardForm.controls.holder" autocomplete="cc-name">
                      </div>
                    </div>
                  </div>
                }

                <div class="step-nav">
                  <button type="button" class="btn-back" (click)="goToStep(2)">← Volver</button>
                  <button type="button" class="btn-next" (click)="goToStep(4)">Revisar y confirmar →</button>
                </div>
              </section>
            }

            <!-- Step 4: Review & Confirm -->
            @if (currentStep() === 4) {
              <section class="step-panel" aria-labelledby="step4-title">
                <h2 id="step4-title" class="step-title">
                  <span class="step-badge">4</span> Revisión y confirmación
                </h2>

                <!-- Items -->
                <div class="review-items">
                  @for (item of cart.items(); track item.id) {
                    <div class="review-item">
                      <span class="review-emoji" aria-hidden="true">{{ item.emoji }}</span>
                      <div class="review-item-info">
                        <div class="review-item-name">{{ item.name }}</div>
                        <div class="review-item-meta">{{ item.brand }} · ×{{ item.qty }} · 🏆 Garantía 3 años</div>
                      </div>
                      <div class="review-item-price">{{ (item.price * item.qty).toFixed(2) }}€</div>
                    </div>
                  }
                </div>

                <!-- Address & shipping summary -->
                <div class="review-summary-grid">
                  <div>
                    <strong>📍 Entrega:</strong><br>
                    {{ addressForm.value.firstName }} {{ addressForm.value.lastName }}<br>
                    {{ addressForm.value.address }}<br>
                    {{ addressForm.value.zip }} {{ addressForm.value.city }}, {{ addressForm.value.country }}
                  </div>
                  <div>
                    <strong>📦 Envío:</strong> {{ selectedShippingLabel() }}<br>
                    <strong>💳 Pago:</strong> {{ selectedPaymentLabel() }}
                  </div>
                </div>

                <!-- Totals -->
                <div class="review-totals">
                  <div class="review-total-row">
                    <span>Subtotal</span>
                    <span>{{ cart.subtotal().toFixed(2) }}€</span>
                  </div>
                  <div class="review-total-row">
                    <span>Envío</span>
                    <span [class.free-text]="shippingCost() === 0">
                      {{ shippingCost() === 0 ? 'GRATIS' : shippingCost().toFixed(2) + '€' }}
                    </span>
                  </div>
                  <div class="review-total-row grand">
                    <span>Total (IVA incl.)</span>
                    <span class="grand-amount">{{ grandTotal().toFixed(2) }}€</span>
                  </div>
                </div>

                <div class="step-nav">
                  <button type="button" class="btn-back" (click)="goToStep(3)">← Volver</button>
                  <button type="button" class="btn-confirm" (click)="confirmOrder()">
                    ✅ Confirmar y pagar {{ grandTotal().toFixed(2) }}€
                  </button>
                </div>
              </section>
            }
          </div>

          <!-- Right: Order Summary -->
          <aside class="checkout-sidebar" aria-label="Resumen del pedido">
            <div class="sidebar-card">
              <h3 class="sidebar-title">Resumen del pedido</h3>
              @for (item of cart.items(); track item.id) {
                <div class="sum-item">
                  <span aria-hidden="true">{{ item.emoji }}</span>
                  <span class="sum-item-name">{{ item.name }} ×{{ item.qty }}</span>
                  <span class="sum-item-price">{{ (item.price * item.qty).toFixed(2) }}€</span>
                </div>
              }
              <div class="sum-divider"></div>
              <div class="sum-row">
                <span>Subtotal</span>
                <span>{{ cart.subtotal().toFixed(2) }}€</span>
              </div>
              <div class="sum-row">
                <span>Envío</span>
                <span [class.free-text]="shippingCost() === 0">
                  {{ shippingCost() === 0 ? 'GRATIS' : shippingCost().toFixed(2) + '€' }}
                </span>
              </div>
              <div class="sum-row sum-total">
                <span>Total</span>
                <span>{{ grandTotal().toFixed(2) }}€</span>
              </div>
              <div class="sum-vat">IVA (21%) incluido · Envío gratis +49€</div>

              <div class="trust-badges">
                <span>🔒 SSL Seguro</span>
                <span>🛡️ Compra protegida</span>
                <span>🔄 30 días devolución</span>
              </div>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .checkout-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px;
      font-family: var(--font-body);
    }
    .breadcrumb {
      font-size: 12px;
      color: var(--c-gray-400, #9ca3af);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .breadcrumb a { color: var(--c-gray-400, #9ca3af); text-decoration: none; }
    .breadcrumb a:hover { color: var(--primary); text-decoration: underline; }
    .bc-sep { opacity: .5; }

    /* Layout */
    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .checkout-layout { grid-template-columns: 1fr; }
      .checkout-sidebar { order: -1; }
    }

    /* Steps bar */
    .steps-bar {
      display: flex;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .step {
      flex: 1;
      padding: 10px 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .step.done { color: var(--green); background: #f0fdf4; }
    .step.current { color: var(--primary); background: #fff9f9; }
    .step-num {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 2px solid #e5e7eb;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 10px;
    }
    .step.done .step-num { background: var(--primary); border-color: var(--green); color: #fff; }
    .step.current .step-num { border-color: var(--primary); color: var(--primary); }

    /* Step panel */
    .step-panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
    }
    .step-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-display);
    }
    .step-badge {
      background: var(--primary);
      color: #fff;
      width: 22px; height: 22px;
      border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px;
    }

    /* Forms */
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 480px) {
      .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
    }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .form-label { font-size: 12px; font-weight: 600; color: #374151; }
    .form-input {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--font-body);
      outline: none;
      transition: border-color .15s;
    }
    .form-input:focus { border-color: var(--primary); }
    .form-input.invalid { border-color: #ef4444; }
    .field-error { font-size: 11px; color: #ef4444; }

    /* Shipping options */
    .ship-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .ship-opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .ship-opt.sel { border-color: var(--primary); background: #fff9f9; }
    .ship-opt:hover { border-color: #9ca3af; }
    .ship-opt input[type=radio] { accent-color: var(--primary); }
    .ship-icon { font-size: 18px; }
    .ship-info { flex: 1; }
    .ship-name { font-size: 13px; font-weight: 700; }
    .ship-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .ship-price { font-size: 13px; font-weight: 700; white-space: nowrap; }
    .ship-price.free { color: var(--green); }

    /* Payment options */
    .pay-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .pay-opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color .15s;
    }
    .pay-opt.sel { border-color: var(--primary); background: #fff9f9; }
    .pay-opt input[type=radio] { accent-color: var(--primary); }
    .pay-icon { font-size: 18px; }
    .pay-info { flex: 1; }
    .pay-name { font-size: 12px; font-weight: 700; }
    .pay-desc { font-size: 10px; color: #6b7280; }
    .card-form {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
    }

    /* Navigation buttons */
    .step-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      gap: 8px;
    }
    .step-nav-end { justify-content: flex-end; }
    .btn-next {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    .btn-next:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-next:disabled { opacity: .5; cursor: not-allowed; }
    .btn-back {
      background: transparent;
      border: 1px solid #d1d5db;
      color: #374151;
      padding: 9px 16px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-back:hover { background: #f3f4f6; }
    .btn-confirm {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    .btn-confirm:hover { background: var(--primary-dark); }

    /* Review */
    .review-items { margin-bottom: 12px; }
    .review-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
    }
    .review-emoji { font-size: 22px; }
    .review-item-info { flex: 1; }
    .review-item-name { font-weight: 600; }
    .review-item-meta { color: #6b7280; font-size: 10px; margin-top: 2px; }
    .review-item-price { font-weight: 700; white-space: nowrap; }
    .review-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
      font-size: 11px;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .review-totals { border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .review-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 3px 0;
    }
    .review-total-row.grand {
      font-size: 15px;
      font-weight: 700;
      border-top: 2px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 4px;
    }
    .grand-amount { color: var(--primary); }
    .free-text { color: var(--green); font-weight: 700; }

    /* Sidebar */
    .checkout-sidebar { position: sticky; top: 16px; }
    .sidebar-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
    }
    .sidebar-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--primary);
      font-family: var(--font-display);
    }
    .sum-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 11px;
      border-bottom: 1px solid #f3f4f6;
    }
    .sum-item-name { flex: 1; }
    .sum-item-price { font-weight: 600; white-space: nowrap; }
    .sum-divider { border-top: 1px solid #e5e7eb; margin: 8px 0; }
    .sum-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 3px 0;
    }
    .sum-total { font-weight: 700; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
    .sum-vat { font-size: 10px; color: #9ca3af; margin-top: 6px; }
    .trust-badges {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
      font-size: 11px;
      color: var(--green);
    }

    /* Confirm screen */
    .confirm-screen {
      max-width: 480px;
      margin: 40px auto;
      text-align: center;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 32px;
    }
    .confirm-icon { font-size: 48px; margin-bottom: 12px; }
    .confirm-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; font-family: var(--font-display); }
    .confirm-order { font-size: 13px; color: #374151; margin-bottom: 8px; }
    .confirm-order strong { color: var(--primary); }
    .confirm-msg { font-size: 12px; color: #374151; line-height: 1.6; margin-bottom: 6px; }
    .confirm-delivery { font-size: 12px; color: #374151; margin-bottom: 20px; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      background: var(--primary);
      color: #fff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid #d1d5db;
      color: #374151;
      text-decoration: none;
      padding: 9px 20px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
    }
  `]
})
export class CheckoutComponent implements OnInit {
  readonly cart = inject(CartService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly currentStep = signal(1);
  readonly confirmed = signal(false);
  readonly selectedShipping = signal('standard');
  readonly selectedPayment = signal('card');

  readonly steps = [
    { n: 1, label: 'Datos' },
    { n: 2, label: 'Envío' },
    { n: 3, label: 'Pago' },
    { n: 4, label: 'Confirmar' },
  ];

  readonly shippingOptions: ShippingOption[] = [
    { id: 'standard', icon: '🚚', name: 'Envío estándar (3-5 días hábiles)', desc: 'Correos Express / SEUR · Seguimiento incluido', price: 0 },
    { id: 'express',  icon: '⚡', name: 'Envío urgente 24h',                  desc: 'Pedidos antes 14h · DHL Express · Garantizado', price: 9.99 },
    { id: 'pickup',   icon: '🏪', name: 'Recogida en tienda (GRATIS)',         desc: 'Madrid · Barcelona · Valencia · Listo en 2h', price: 0 },
  ];

  readonly paymentOptions: PaymentOption[] = [
    { id: 'card',     icon: '💳', name: 'Tarjeta crédito/débito',    desc: 'Visa, Mastercard, Amex · SSL seguro' },
    { id: 'paypal',   icon: '🅿️', name: 'PayPal',                   desc: 'Redireccionado a PayPal para pago seguro' },
    { id: 'aplazame', icon: '💰', name: 'Aplazame — Desde 0% TAE',  desc: '3-36 meses · Aprobación inmediata' },
    { id: 'bizum',    icon: '📱', name: 'Bizum',                     desc: 'Pago instantáneo con tu número de móvil' },
    { id: 'transfer', icon: '🏦', name: 'Transferencia bancaria',    desc: 'Confirmación al recibir el pago (1-2 días)' },
  ];

  readonly addressForm = this.fb.group({
    firstName: ['Javier', Validators.required],
    lastName:  ['Martínez López', Validators.required],
    email:     ['javier.martinez@email.com', [Validators.required, Validators.email]],
    phone:     ['+34 612 345 678'],
    address:   ['Calle Gran Vía, 42, 3º B', Validators.required],
    city:      ['Madrid'],
    zip:       ['28013'],
    country:   ['España'],
  });

  readonly cardForm = this.fb.group({
    number: [''],
    expiry: [''],
    cvv:    [''],
    holder: [''],
  });

  readonly shippingCost = computed(() => {
    const opt = this.shippingOptions.find(o => o.id === this.selectedShipping());
    return opt?.price ?? 0;
  });

  readonly grandTotal = computed(() =>
    Math.round((this.cart.subtotal() + this.shippingCost()) * 100) / 100
  );

  readonly selectedShippingLabel = computed(() =>
    this.shippingOptions.find(o => o.id === this.selectedShipping())?.name ?? ''
  );

  readonly selectedPaymentLabel = computed(() =>
    this.paymentOptions.find(o => o.id === this.selectedPayment())?.name ?? ''
  );

  ngOnInit(): void {}

  isInvalid(field: string): boolean {
    const ctrl = this.addressForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  goToStep(n: number): void {
    if (n === 2) {
      this.addressForm.markAllAsTouched();
      if (this.addressForm.invalid) return;
      this.toast.show('✅ Datos guardados');
    }
    if (n === 3) this.toast.show('✅ Envío seleccionado');
    if (n === 4) this.toast.show('✅ Pago configurado');
    this.currentStep.set(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmOrder(): void {
    this.cart.clear();
    this.confirmed.set(true);
    this.toast.show('🎉 ¡Pedido confirmado!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
