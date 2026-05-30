import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

interface AdminMenuItem {
  label: string;
  description: string;
  icon: string;
  route: string;
}

interface AdminMenuSection {
  title: string;
  items: AdminMenuItem[];
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly store = inject(AuthStore);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  notificationCount = 3;
  showUserMenu = false;
  showAdminMenu = false;
  showSearchInput = false;
  quickSearchTerm = '';

  readonly adminSections: AdminMenuSection[] = [
    {
      title: 'Organización',
      items: [
        {
          label: 'Empresas',
          description: 'Identidad fiscal, razón social y configuración principal.',
          icon: 'business',
          route: '/configuracion/general/empresas',
        },
        {
          label: 'Sucursales y depósitos',
          description: 'Puntos de venta, stock distribuido y estructura operativa.',
          icon: 'store',
          route: '/configuracion/general/sucursales',
        },
      ],
    },
    {
      title: 'Accesos',
      items: [
        {
          label: 'Usuarios',
          description: 'Altas, estados y administración de acceso del equipo.',
          icon: 'manage_accounts',
          route: '/configuracion/usuarios',
        },
        {
          label: 'Roles y permisos',
          description: 'Perfiles, alcance operativo y políticas por área.',
          icon: 'admin_panel_settings',
          route: '/admin/roles',
        },
      ],
    },
    {
      title: 'Operación',
      items: [
        {
          label: 'Archivos maestros',
          description: 'Parámetros base y catálogos auxiliares del sistema.',
          icon: 'folder_open',
          route: '/configuracion/archivos',
        },
        {
          label: 'Importaciones',
          description: 'Carga masiva de datos, migraciones y sincronización.',
          icon: 'upload_file',
          route: '/importaciones',
        },
      ],
    },
    {
      title: 'Control',
      items: [
        {
          label: 'Ajustes del sistema',
          description: 'Preferencias globales y parámetros de experiencia.',
          icon: 'tune',
          route: '/dashboard/settings',
        },
        {
          label: 'Auditoría',
          description: 'Trazabilidad de actividad y seguimiento administrativo.',
          icon: 'policy',
          route: '/admin/auditoria',
        },
      ],
    },
  ];

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(event?: Event) {
    event?.stopPropagation();
    this.showAdminMenu = false;
    this.showUserMenu = !this.showUserMenu;
  }

  toggleAdminMenu(event?: Event) {
    event?.stopPropagation();
    this.showUserMenu = false;
    this.showAdminMenu = !this.showAdminMenu;
  }

  toggleSearchInput() {
    this.showSearchInput = !this.showSearchInput;
    if (!this.showSearchInput) {
      this.quickSearchTerm = '';
    }
  }

  onSearchButtonClick() {
    if (this.showSearchInput && this.quickSearchTerm.trim().length > 0) {
      this.submitQuickSearch();
      return;
    }

    this.toggleSearchInput();
  }

  submitQuickSearch() {
    const term = this.quickSearchTerm.trim();
    if (!term) {
      return;
    }

    this.router.navigate(['/products'], {
      queryParams: { q: term },
    });

    this.showSearchInput = false;
    this.quickSearchTerm = '';
  }

  onMenuNavigation() {
    this.closeMenus();
  }

  logout() {
    this.closeMenus();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/landing/login']);
      },
      error: () => {
        this.router.navigate(['/landing/login']);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenus();
    }
  }

  private closeMenus() {
    this.showUserMenu = false;
    this.showAdminMenu = false;
  }
}
