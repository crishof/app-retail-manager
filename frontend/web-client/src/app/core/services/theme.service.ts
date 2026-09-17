import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'rm-theme';

/**
 * Gestiona el modo claro/oscuro del Design System.
 *
 * - Por defecto sigue `prefers-color-scheme` del sistema operativo.
 * - La elección explícita del usuario se recuerda en localStorage.
 * - Aplica el atributo `data-theme` en <html>, que dispara los overrides de
 *   tokens en design-system.css:
 *     · sin atributo        → automático según el SO (media query)
 *     · data-theme="dark"   → oscuro forzado
 *     · data-theme="light"  → claro forzado
 *
 * SSR-safe: en el servidor no toca document/localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Preferencia del usuario ('system' = seguir al SO). */
  readonly preference = signal<ThemePreference>(this.readStoredPreference());

  /** Estado del SO cuando la preferencia es 'system'. */
  private readonly systemDark = signal<boolean>(this.readSystemDark());

  /** Modo efectivo actualmente aplicado. */
  readonly isDark = computed<boolean>(() => {
    const pref = this.preference();
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    return this.systemDark();
  });

  constructor() {
    // Aplica el atributo cada vez que cambia la preferencia.
    effect(() => {
      const pref = this.preference();
      this.applyAttribute(pref);
    });

    // Reacciona a cambios del SO mientras el usuario esté en 'system'.
    if (this.isBrowser && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', (e) => this.systemDark.set(e.matches));
    }
  }

  /** Fija una preferencia explícita y la persiste. */
  set(pref: ThemePreference): void {
    this.preference.set(pref);
    if (!this.isBrowser) return;
    try {
      if (pref === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, pref);
      }
    } catch {
      /* storage no disponible (modo privado, etc.): se ignora */
    }
  }

  /** Alterna entre claro y oscuro a partir del modo efectivo actual. */
  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  // ── internos ────────────────────────────────────────────────────────────

  private applyAttribute(pref: ThemePreference): void {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    if (pref === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', pref);
    }
  }

  private readStoredPreference(): ThemePreference {
    if (!this.isBrowser) return 'system';
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark') return v;
    } catch {
      /* ignore */
    }
    return 'system';
  }

  private readSystemDark(): boolean {
    if (!this.isBrowser || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
