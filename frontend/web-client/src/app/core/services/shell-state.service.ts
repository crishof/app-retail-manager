import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Estado compartido del shell (rail + panel contextual + topbar), para coordinar
 * componentes hermanos sin subir todo a AppComponent.
 *
 * - `isNarrow`: por debajo de 1180px el panel contextual pasa a cajón superpuesto.
 * - `panelCollapsed`: en escritorio, oculta/expande el panel contextual.
 * - `drawerOpen`: en angosto, abre/cierra el cajón.
 */
@Injectable({ providedIn: 'root' })
export class ShellStateService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private static readonly BREAKPOINT = 1180;

  readonly isNarrow = signal(false);
  readonly panelCollapsed = signal(false);
  readonly drawerOpen = signal(false);

  constructor() {
    if (!this.isBrowser || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${ShellStateService.BREAKPOINT - 1}px)`);
    this.isNarrow.set(mql.matches);
    mql.addEventListener('change', (e) => {
      this.isNarrow.set(e.matches);
      if (!e.matches) this.drawerOpen.set(false); // al ensanchar, cerrar cajón
    });
  }

  /** Botón hamburguesa (sólo visible en angosto): abre/cierra el cajón. */
  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
