import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type UiButtonSize = 'md' | 'sm' | 'icon';

/**
 * Botón del Design System.
 *
 * - Un solo primario por vista: el primario es TINTA (--ink), no el acento.
 * - Estado de carga con spinner y disabled accesible (aria-busy / aria-disabled).
 * - `icon` para botón cuadrado de sólo ícono (pasar aria-label desde el consumidor).
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [class]="classes()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? 'true' : null"
      (click)="pressed.emit($event)"
    >
      @if (loading()) {
        <span class="ui-btn__spinner" aria-hidden="true"></span>
      }
      <span class="ui-btn__content" [class.ui-btn--hidden]="loading()">
        <ng-content />
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    button {
      position: relative;
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
      font-family: var(--font-sans);
      font-size: var(--fs-base); font-weight: 600; line-height: 1;
      border-radius: var(--r-sm);
      border: 1px solid transparent;
      padding: .5rem .875rem;
      cursor: pointer;
      transition: background var(--t), border-color var(--t), color var(--t), opacity var(--t);
      white-space: nowrap;
    }
    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    button:disabled { cursor: not-allowed; opacity: .5; }

    /* primario = tinta */
    .ui-btn--primary { background: var(--ink); color: var(--surface); }
    .ui-btn--primary:hover:not(:disabled) { background: var(--ink-2); }

    .ui-btn--secondary { background: var(--surface); color: var(--ink); border-color: var(--border-strong); }
    .ui-btn--secondary:hover:not(:disabled) { background: var(--surface-2); }

    .ui-btn--quiet { background: transparent; color: var(--ink-2); }
    .ui-btn--quiet:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }

    .ui-btn--danger { background: var(--stop); color: #fff; }
    .ui-btn--danger:hover:not(:disabled) { filter: brightness(.94); }

    .ui-btn--sm { padding: .3125rem .625rem; font-size: var(--fs-sm); }
    .ui-btn--icon { padding: .5rem; width: 2.25rem; height: 2.25rem; }
    .ui-btn--sm.ui-btn--icon { width: 2rem; height: 2rem; }

    .ui-btn--hidden { visibility: hidden; }
    .ui-btn__spinner {
      position: absolute; width: 1rem; height: 1rem; border-radius: 50%;
      border: 2px solid currentColor; border-top-color: transparent;
      animation: ui-btn-spin .6s linear infinite;
    }
    @keyframes ui-btn-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .ui-btn__spinner { animation-duration: 1.2s; } }
  `],
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('secondary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly pressed = output<MouseEvent>();

  protected readonly classes = computed(() =>
    ['ui-btn', `ui-btn--${this.variant()}`, `ui-btn--${this.size()}`]
      .filter(Boolean)
      .join(' '),
  );
}
