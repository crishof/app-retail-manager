import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  data?: any;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-gray-900 text-white h-screen fixed left-0 top-16 overflow-y-auto hidden lg:flex flex-col">
      <nav class="flex-1 px-4 py-6 space-y-2">
        @for (item of navItems; track item.route) {
          @if (!item.children) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-blue-600"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <span class="text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <div class="space-y-1">
              <button
                (click)="toggleSection(item.label)"
                class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition"
              >
                <span class="flex items-center gap-3">
                  <span class="text-lg">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </span>
                <svg
                  class="w-4 h-4 transition-transform"
                  [class.rotate-180]="expandedSections[item.label]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              @if (expandedSections[item.label]) {
                <div class="space-y-1 pl-4">
                  @for (child of item.children; track child.route) {
                    <a
                      [routerLink]="child.route"
                      routerLinkActive="bg-blue-600"
                      [routerLinkActiveOptions]="{ exact: false }"
                      class="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition"
                    >
                      <span class="text-base">{{ child.icon }}</span>
                      <span>{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        }
      </nav>

      <!-- Footer -->
      <div class="px-4 py-4 border-t border-gray-800">
        <p class="text-xs text-gray-500">© 2026 RetailManager</p>
      </div>
    </aside>
  `,
  styles: []
})
export class SidebarComponent {
  expandedSections: { [key: string]: boolean } = {
    'Catalog': true,
    'Sales': true,
    'Admin': false
  };

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard'
    },
    {
      label: 'Catalog',
      icon: '📦',
      route: '/catalog',
      children: [
        { label: 'Products', icon: '📦', route: '/products' },
        { label: 'Brands', icon: '🏷️', route: '/brand' },
        { label: 'Categories', icon: '📂', route: '/category' }
      ]
    },
    {
      label: 'Sales',
      icon: '💰',
      route: '/sales',
      children: [
        { label: 'Invoices', icon: '📄', route: '/customerInvoice', data: { voucherType: 'FACTURA_B' } },
        { label: 'View Invoices', icon: '📋', route: '/comprobantes/ver' },
        { label: 'Quotes', icon: '💬', route: '/comprobantes/presupuesto' },
        { label: 'Credit Notes', icon: '📝', route: '/comprobantes/nota-credito' }
      ]
    },
    {
      label: 'Inventory',
      icon: '📦',
      route: '/inventory',
      children: [
        { label: 'Stock', icon: '📊', route: '/almacen/inventario' },
        { label: 'Remitos', icon: '📦', route: '/almacen/remito' }
      ]
    },
    {
      label: 'Suppliers',
      icon: '🤝',
      route: '/supplier'
    },
    {
      label: 'Customers',
      icon: '👥',
      route: '/clientes'
    },
    {
      label: 'Cash',
      icon: '💳',
      route: '/caja'
    },
     {
       label: 'Analytics',
       icon: '📈',
       route: '/dashboard/analytics'
     },
    {
      label: 'Admin',
      icon: '⚙️',
      route: '/admin',
      children: [
        { label: 'Users', icon: '👤', route: '/configuracion/usuarios' },
        { label: 'Companies', icon: '🏢', route: '/configuracion/general/empresas' },
        { label: 'Branches', icon: '🏪', route: '/configuracion/general/sucursales' },
        { label: 'Settings', icon: '⚙️', route: '/configuracion/general' }
      ]
    }
  ];

  toggleSection(label: string): void {
    this.expandedSections[label] = !this.expandedSections[label];
  }
}
