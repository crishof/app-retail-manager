import {
  Component, ChangeDetectionStrategy, signal, OnInit, inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'security';

@Component({
  selector: 'app-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="account-page">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/">Inicio</a>
        <span class="bc-sep">›</span>
        <span>Mi cuenta</span>
      </nav>

      <div class="account-layout">
        <!-- Sidebar nav -->
        <nav class="account-nav" aria-label="Navegación de cuenta">
          <div class="account-avatar" aria-hidden="true">
            <span class="avatar-initials">JM</span>
          </div>
          <div class="account-user-name">Javier Martínez</div>
          <div class="account-user-email">javier.martinez@email.com</div>

          <ul class="nav-list" role="list">
            @for (tab of tabs; track tab.id) {
              <li>
                <button
                  class="nav-item"
                  [class.active]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)"
                  [attr.aria-current]="activeTab() === tab.id ? 'page' : null"
                >
                  <span aria-hidden="true">{{ tab.icon }}</span>
                  {{ tab.label }}
                </button>
              </li>
            }
          </ul>

          <button class="btn-logout">🚪 Cerrar sesión</button>
        </nav>

        <!-- Main content -->
        <div class="account-content">

          <!-- Profile -->
          @if (activeTab() === 'profile') {
            <section aria-labelledby="profile-title">
              <h2 id="profile-title" class="section-title">Datos personales</h2>
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label" for="fn">Nombre</label>
                    <input id="fn" class="form-input" formControlName="firstName">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="ln">Apellidos</label>
                    <input id="ln" class="form-input" formControlName="lastName">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="em">Email</label>
                  <input id="em" class="form-input" type="email" formControlName="email">
                </div>
                <div class="form-group">
                  <label class="form-label" for="ph">Teléfono</label>
                  <input id="ph" class="form-input" type="tel" formControlName="phone">
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-save"
                    [disabled]="profileForm.pristine || profileForm.invalid">
                    Guardar cambios
                  </button>
                  @if (profileSaved()) {
                    <span class="save-ok" role="status">✅ Cambios guardados</span>
                  }
                </div>
              </form>
            </section>
          }

          <!-- Orders -->
          @if (activeTab() === 'orders') {
            <section aria-labelledby="orders-title">
              <h2 id="orders-title" class="section-title">Mis pedidos</h2>
              <div class="orders-list" role="list">
                @for (order of orders; track order.id) {
                  <div class="order-card" role="listitem">
                    <div class="order-top">
                      <div>
                        <div class="order-id">Pedido {{ order.id }}</div>
                        <div class="order-date">{{ order.date }}</div>
                      </div>
                      <span class="order-status" [class]="order.statusClass">
                        {{ order.status }}
                      </span>
                    </div>
                    <div class="order-items">{{ order.summary }}</div>
                    <div class="order-total">Total: <strong>{{ order.total }}€</strong></div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Addresses -->
          @if (activeTab() === 'addresses') {
            <section aria-labelledby="addr-title">
              <h2 id="addr-title" class="section-title">Mis direcciones</h2>
              <div class="addr-grid">
                @for (addr of addresses; track addr.id) {
                  <div class="addr-card" [class.default]="addr.isDefault">
                    @if (addr.isDefault) {
                      <span class="default-badge">Principal</span>
                    }
                    <div class="addr-name">{{ addr.name }}</div>
                    <div class="addr-line">{{ addr.line1 }}</div>
                    <div class="addr-line">{{ addr.city }}, {{ addr.country }}</div>
                    <div class="addr-actions">
                      <button class="btn-link">Editar</button>
                      @if (!addr.isDefault) {
                        <button class="btn-link">Eliminar</button>
                      }
                    </div>
                  </div>
                }
                <button class="addr-add">
                  <span aria-hidden="true">＋</span> Añadir dirección
                </button>
              </div>
            </section>
          }

          <!-- Security -->
          @if (activeTab() === 'security') {
            <section aria-labelledby="sec-title">
              <h2 id="sec-title" class="section-title">Seguridad</h2>
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
                <div class="form-group">
                  <label class="form-label" for="currentPwd">Contraseña actual</label>
                  <input id="currentPwd" class="form-input" type="password" formControlName="current"
                    autocomplete="current-password">
                </div>
                <div class="form-group">
                  <label class="form-label" for="newPwd">Nueva contraseña</label>
                  <input id="newPwd" class="form-input" type="password" formControlName="newPwd"
                    autocomplete="new-password">
                </div>
                <div class="form-group">
                  <label class="form-label" for="confirmPwd">Confirmar nueva contraseña</label>
                  <input id="confirmPwd" class="form-input" type="password" formControlName="confirm"
                    autocomplete="new-password">
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-save"
                    [disabled]="passwordForm.invalid">
                    Cambiar contraseña
                  </button>
                </div>
              </form>
            </section>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 16px;
      font-family: var(--font-body);
    }
    .breadcrumb {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .breadcrumb a { color: #9ca3af; text-decoration: none; }
    .breadcrumb a:hover { color: var(--c-red, #dc2626); }
    .bc-sep { opacity: .5; }

    .account-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 640px) {
      .account-layout { grid-template-columns: 1fr; }
    }

    /* Sidebar */
    .account-nav {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
    }
    .account-avatar {
      width: 60px; height: 60px;
      border-radius: 50%;
      background: var(--c-red, #dc2626);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 8px;
    }
    .avatar-initials { color: #fff; font-weight: 700; font-size: 18px; }
    .account-user-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    .account-user-email { font-size: 11px; color: #6b7280; margin-bottom: 16px; }

    .nav-list { list-style: none; padding: 0; margin: 0 0 16px; text-align: left; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      background: none;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: #374151;
      text-align: left;
      transition: background .15s;
    }
    .nav-item:hover { background: #f3f4f6; }
    .nav-item.active { background: #fff9f9; color: var(--c-red, #dc2626); font-weight: 700; }
    .btn-logout {
      width: 100%;
      padding: 8px;
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
    }
    .btn-logout:hover { border-color: #ef4444; color: #ef4444; }

    /* Content */
    .account-content {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
    }
    .section-title {
      font-family: var(--font-display, 'Barlow Condensed');
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--c-red, #dc2626);
      text-transform: uppercase;
    }

    /* Forms */
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 480px) { .form-grid-2 { grid-template-columns: 1fr; } }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .form-label { font-size: 12px; font-weight: 600; color: #374151; }
    .form-input {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--font-body);
      outline: none;
    }
    .form-input:focus { border-color: var(--c-red, #dc2626); }
    .form-actions { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .btn-save {
      background: var(--c-red, #dc2626);
      color: #fff;
      border: none;
      padding: 9px 20px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-save:hover:not(:disabled) { background: #b91c1c; }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }
    .save-ok { font-size: 12px; color: #16a34a; font-weight: 600; }

    /* Orders */
    .orders-list { display: flex; flex-direction: column; gap: 12px; }
    .order-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
    }
    .order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .order-id { font-size: 13px; font-weight: 700; }
    .order-date { font-size: 11px; color: #9ca3af; }
    .order-status {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .order-status.delivered { background: #f0fdf4; color: #16a34a; }
    .order-status.processing { background: #fffbeb; color: #d97706; }
    .order-status.shipped { background: #eff6ff; color: #2563eb; }
    .order-items { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .order-total { font-size: 12px; color: #6b7280; }
    .order-total strong { color: #111; }

    /* Addresses */
    .addr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .addr-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      position: relative;
      font-size: 12px;
      line-height: 1.5;
    }
    .addr-card.default { border-color: var(--c-red, #dc2626); }
    .default-badge {
      position: absolute; top: 8px; right: 8px;
      background: var(--c-red, #dc2626); color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 20px;
    }
    .addr-name { font-weight: 700; margin-bottom: 2px; }
    .addr-line { color: #6b7280; }
    .addr-actions { margin-top: 8px; display: flex; gap: 10px; }
    .btn-link { background: none; border: none; color: var(--c-red, #dc2626); font-size: 12px; font-weight: 600; cursor: pointer; padding: 0; }
    .btn-link:hover { text-decoration: underline; }
    .addr-add {
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      background: none;
      font-size: 13px;
      font-weight: 600;
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      transition: border-color .15s, color .15s;
    }
    .addr-add:hover { border-color: var(--c-red, #dc2626); color: var(--c-red, #dc2626); }
  `]
})
export class AccountComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly activeTab = signal<AccountTab>('profile');
  readonly profileSaved = signal(false);

  readonly tabs: { id: AccountTab; icon: string; label: string }[] = [
    { id: 'profile',   icon: '👤', label: 'Perfil' },
    { id: 'orders',    icon: '📦', label: 'Mis pedidos' },
    { id: 'addresses', icon: '📍', label: 'Direcciones' },
    { id: 'security',  icon: '🔒', label: 'Seguridad' },
  ];

  readonly profileForm = this.fb.group({
    firstName: ['Javier', Validators.required],
    lastName:  ['Martínez López', Validators.required],
    email:     ['javier.martinez@email.com', [Validators.required, Validators.email]],
    phone:     ['+34 612 345 678'],
  });

  readonly passwordForm = this.fb.group({
    current: ['', Validators.required],
    newPwd:  ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  readonly orders = [
    { id: '#RM-2025-48291', date: '12 mayo 2025', status: 'Entregado',   statusClass: 'delivered',  summary: 'Fender American Pro II Stratocaster + Fender Blues Junior IV', total: '1.538,00' },
    { id: '#RM-2025-41200', date: '3 mayo 2025',  status: 'En tránsito', statusClass: 'shipped',    summary: 'Shure SM57 + cables XLR × 3', total: '118,97' },
    { id: '#RM-2025-33812', date: '15 abr 2025',  status: 'Procesando',  statusClass: 'processing', summary: 'Korg Minilogue XD', total: '499,00' },
  ];

  readonly addresses = [
    { id: 'a1', name: 'Javier Martínez López', line1: 'Calle Gran Vía, 42, 3º B', city: 'Madrid 28013', country: 'España', isDefault: true },
    { id: 'a2', name: 'Javier Martínez (Trabajo)', line1: 'Paseo de la Castellana, 110, 4ª planta', city: 'Madrid 28046', country: 'España', isDefault: false },
  ];

  ngOnInit(): void {}

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileSaved.set(true);
    setTimeout(() => this.profileSaved.set(false), 3000);
    this.profileForm.markAsPristine();
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordForm.reset();
  }
}
