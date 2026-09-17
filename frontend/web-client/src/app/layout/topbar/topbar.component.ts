import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthStore } from '../../core/auth/auth.store';
import { ThemeService } from '../../core/services/theme.service';
import { findNavBreadcrumbs } from '../navigation/navigation.config';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  readonly store = inject(AuthStore);
  readonly theme = inject(ThemeService);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  notificationCount = 3;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly breadcrumbs = computed(() => findNavBreadcrumbs(this.currentUrl(), this.store.userRole() ?? 'USER'));
  readonly currentSection = computed(() => this.breadcrumbs()[0]?.label ?? 'Inicio');

  onToggle() {
    this.toggleSidebar.emit();
  }
}
