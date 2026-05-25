import { Injectable, signal } from '@angular/core';
import { Tenant } from '../models';
import { TENANTS } from '../data/mock-data';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly STORAGE_KEY = 'rm_tenant';

  private _current = signal<Tenant>(this.loadTenant());

  readonly current = this._current.asReadonly();

  private loadTenant(): Tenant {
    const id = localStorage.getItem(this.STORAGE_KEY) || 'thomann-demo';
    return TENANTS[id] || TENANTS['thomann-demo'];
  }

  setTenant(id: string): void {
    const tenant = TENANTS[id];
    if (!tenant) return;
    this._current.set(tenant);
    localStorage.setItem(this.STORAGE_KEY, id);
    // Apply brand color as CSS variable
    document.documentElement.style.setProperty('--red', tenant.color);
    document.documentElement.style.setProperty('--red-dark', this.darken(tenant.color));
  }

  private darken(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 30);
    const g = Math.max(0, ((n >> 8) & 0xff) - 30);
    const b = Math.max(0, (n & 0xff) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getAllTenants(): Tenant[] {
    return Object.values(TENANTS);
  }
}
