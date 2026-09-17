import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthStore } from '../../core/auth/auth.store';
import { ThemeService } from '../../core/services/theme.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { WorkspaceContextService } from '../../core/context/workspace-context.service';
import { findNavBreadcrumbs } from '../navigation/navigation.config';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  readonly store = inject(AuthStore);
  readonly theme = inject(ThemeService);
  readonly shell = inject(ShellStateService);
  readonly workspace = inject(WorkspaceContextService);

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

  onCompanyChange(companyId: string): void { this.workspace.selectCompany(companyId); }
  onBranchChange(branchId: string): void { this.workspace.selectBranch(branchId); }
}
