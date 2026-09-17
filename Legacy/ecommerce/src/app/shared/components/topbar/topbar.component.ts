import { Component, inject, OnInit } from '@angular/core';
import { TenantService } from '../../../core/services/tenant.service';
import { TENANTS } from '../../../core/data/mock-data';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <div class="topbar" role="banner">
      <div class="topbar-inner">

        <!-- Left: contact -->
        <div class="topbar-left">
          <span class="topbar-phone">+34 91 123 45 67</span>
          <span class="topbar-sep" aria-hidden="true">|</span>
          <span class="topbar-hours">Lu–Vi 9–20h &middot; Sá 10–14h</span>
        </div>

        <!-- Center: promo strip — sin emojis -->
        <div class="topbar-center" aria-label="Ofertas y condiciones">
          <span class="promo-item">Envío gratis desde 49&nbsp;€</span>
          <span class="promo-dot" aria-hidden="true">&middot;</span>
          <span class="promo-item">Garantía 3 años</span>
          <span class="promo-dot" aria-hidden="true">&middot;</span>
          <span class="promo-item">Devolución 30 días</span>
          <span class="promo-dot" aria-hidden="true">&middot;</span>
          <span class="promo-item">Pago en 36 cuotas</span>
        </div>

        <!-- Right: tenant + locale -->
        <div class="topbar-right">
          <select (change)="onTenantChange($event)" class="top-sel" aria-label="Tienda activa">
            @for (t of tenants; track t.id) {
              <option [value]="t.id" [selected]="t.id === tenant().id">{{ t.name }}</option>
            }
          </select>
          <span class="topbar-sep" aria-hidden="true">|</span>
          <select class="top-sel" aria-label="Idioma">
            <option>ES</option>
            <option>EN</option>
            <option>DE</option>
          </select>
          <select class="top-sel" aria-label="Moneda">
            <option>EUR €</option>
            <option>USD $</option>
          </select>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .topbar {
      background: #1c1c1c;
      border-bottom: 1px solid #303030;
      font-size: 11px;
      font-family: var(--font-body);
    }
    .topbar-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 var(--gutter);
      height: 28px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .topbar-phone {
      color: #d1d5db;
      font-weight: 500;
      font-size: 11px;
    }
    .topbar-hours {
      color: #6b7280;
      font-size: 10.5px;
    }
    .topbar-sep {
      color: #404040;
      font-size: 9px;
    }

    .topbar-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      overflow: hidden;
      white-space: nowrap;
    }
    .promo-item {
      color: #9ca3af;
      font-size: 10.5px;
    }
    .promo-dot {
      color: #404040;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .top-sel {
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 10.5px;
      cursor: pointer;
      outline: none;
      padding: 0 2px;
      font-family: var(--font-body);
    }
    .top-sel:hover { color: #d1d5db; }
    .top-sel option { background: #1c1c1c; color: #d1d5db; }

    @media (max-width: 900px) {
      .topbar-hours { display: none; }
      .topbar-center { display: none; }
    }
    @media (max-width: 640px) {
      .topbar-left { display: none; }
    }
  `]
})
export class TopbarComponent implements OnInit {
  private tenantSvc = inject(TenantService);
  readonly tenant   = this.tenantSvc.current;
  readonly tenants  = Object.values(TENANTS);

  ngOnInit(): void {}

  onTenantChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.tenantSvc.setTenant(id);
  }
}
