
import { Component, ElementRef, HostListener, Input, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { WorkspaceContextService } from '../../core/context/workspace-context.service';
import { NavItem, getVisibleNavSections, isNavItemActive, searchPaletteItems } from '../navigation/navigation.config';

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

  @Input() collapsed = false;

  readonly paletteQuery = signal('');
  readonly paletteOpen = signal(false);
  readonly accountMenuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly sections = computed(() => getVisibleNavSections(this.store.userRole() ?? 'USER'));
  readonly paletteResults = computed(() => searchPaletteItems(this.store.userRole() ?? 'USER', this.paletteQuery()));
  readonly userRoleLabel = computed(() => {
    const role = this.store.userRole() ?? 'USER';
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Manager',
      USER: 'Usuario',
    };

    return labels[role] ?? 'Usuario';
  });

  constructor() {
    effect(() => {
      const user = this.store.currentUser();
      this.workspace.initialize(user?.companyName);
    });
  }

  isActive(item: NavItem): boolean {
    return isNavItemActive(item, this.currentUrl());
  }

  openPalette(): void {
    this.paletteOpen.set(true);
  }

  closePalette(): void {
    this.paletteOpen.set(false);
    this.paletteQuery.set('');
  }

  toggleAccountMenu(event?: Event): void {
    event?.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  onCompanyChange(companyId: string): void {
    this.workspace.selectCompany(companyId);
  }

  onBranchChange(branchId: string): void {
    this.workspace.selectBranch(branchId);
  }

  navigate(item: { route?: string; externalUrl?: string }): void {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      this.closePalette();
      return;
    }

    if (item.route) {
      this.router.navigateByUrl(item.route);
      this.closePalette();
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

    if (event.key === 'Escape' && this.paletteOpen()) {
      this.closePalette();
      this.closeAccountMenu();
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
