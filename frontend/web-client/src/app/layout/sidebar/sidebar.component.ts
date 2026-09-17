import { Component, ElementRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { WorkspaceContextService } from '../../core/context/workspace-context.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import {
  NavItem, NavSection, getVisibleNavSections, isNavItemActive, searchPaletteItems,
} from '../navigation/navigation.config';

/**
 * Shell de navegación en dos niveles:
 * - Rail (58px): logo, íconos de sección, búsqueda y cuenta. Siempre visible.
 * - Panel contextual (216px): ítems de la sección activa. Clic en la sección
 *   activa lo colapsa/expande (sin botón aparte). Bajo 1180px pasa a cajón.
 *
 * Las secciones y sus ítems se muestran tal cual están en navigation.config
 * (mismo orden y nombres). El rail es otra forma de mostrar lo mismo.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly store = inject(AuthStore);
  readonly workspace = inject(WorkspaceContextService);
  readonly shell = inject(ShellStateService);

  readonly paletteQuery = signal('');
  readonly paletteOpen = signal(false);
  readonly accountMenuOpen = signal(false);

  /** Sección elegida manualmente en el rail (para previsualizar sus ítems). */
  private readonly pickedSection = signal<string | null>(null);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly sections = computed(() => getVisibleNavSections(this.store.userRole() ?? 'USER'));
  readonly paletteResults = computed(() => searchPaletteItems(this.store.userRole() ?? 'USER', this.paletteQuery()));

  /** Sección que corresponde a la ruta activa. */
  private readonly routeSection = computed<NavSection | undefined>(() => {
    const url = this.currentUrl();
    return this.sections().find((s) => s.items.some((it) => this.matches(it, url)));
  });

  /** Sección mostrada en el panel: la elegida o, si no, la de la ruta. */
  readonly activeSection = computed<NavSection | undefined>(() => {
    const picked = this.pickedSection();
    if (picked) return this.sections().find((s) => s.title === picked);
    return this.routeSection() ?? this.sections()[0];
  });

  readonly userRoleLabel = computed(() => {
    const role = this.store.userRole() ?? 'USER';
    const labels: Record<string, string> = { ADMIN: 'Administrador', MANAGER: 'Manager', USER: 'Usuario' };
    return labels[role] ?? 'Usuario';
  });

  constructor() {
    effect(() => {
      const user = this.store.currentUser();
      this.workspace.initialize(user?.companyName);
    });
  }

  // ── Navegación de secciones (rail) ─────────────────────────────────────
  isSectionActive(section: NavSection): boolean {
    return this.activeSection()?.title === section.title;
  }

  selectSection(section: NavSection): void {
    const isActive = this.isSectionActive(section);

    if (this.shell.isNarrow()) {
      // En angosto: la sección activa cierra el cajón; otra lo abre con sus ítems.
      if (isActive && this.shell.drawerOpen()) {
        this.shell.closeDrawer();
      } else {
        this.pickedSection.set(section.title);
        this.shell.drawerOpen.set(true);
      }
      return;
    }

    // En escritorio: clic en la sección activa colapsa/expande; otra la muestra.
    if (isActive) {
      this.shell.panelCollapsed.update((v) => !v);
    } else {
      this.pickedSection.set(section.title);
      this.shell.panelCollapsed.set(false);
    }
  }

  onNavigate(): void {
    // Al navegar a un ítem, el panel vuelve a seguir a la ruta y el cajón cierra.
    this.pickedSection.set(null);
    this.shell.closeDrawer();
  }

  isActive(item: NavItem): boolean {
    return isNavItemActive(item, this.currentUrl());
  }
  private matches(item: NavItem, url: string): boolean {
    return isNavItemActive(item, url);
  }

  // ── Palette / cuenta ───────────────────────────────────────────────────
  openPalette(): void { this.paletteOpen.set(true); }
  closePalette(): void { this.paletteOpen.set(false); this.paletteQuery.set(''); }

  toggleAccountMenu(event?: Event): void {
    event?.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }
  closeAccountMenu(): void { this.accountMenuOpen.set(false); }

  navigate(item: { route?: string; externalUrl?: string }): void {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      this.closePalette();
      return;
    }
    if (item.route) {
      this.router.navigateByUrl(item.route);
      this.closePalette();
      this.onNavigate();
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/landing/login']),
      error: () => this.router.navigate(['/landing/login']),
    });
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.paletteOpen.update((open) => !open);
      return;
    }
    if (event.key === 'Escape') {
      if (this.paletteOpen()) this.closePalette();
      this.closeAccountMenu();
      this.shell.closeDrawer();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAccountMenu();
      this.closePalette();
    }
  }
}
