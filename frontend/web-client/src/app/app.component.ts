import { Component, computed } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  sidebarCollapsed = false;

  private readonly _url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  hideShell = computed(() => {
    const raw = this._url();
    const pathname = raw.split('?')[0].split('#')[0];
    return pathname.startsWith('/landing') || pathname.startsWith('/auth');
  });

  constructor(private readonly router: Router) {}

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
