import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * Interruptor on/off. Reemplaza los pares "Activar/Desactivar" manteniendo el
 * mismo endpoint y semántica. Accesible: role=switch + aria-checked.
 */
@Component({
  selector: 'ui-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="switch"
      class="ui-switch"
      [class.ui-switch--on]="checked()"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      (click)="checked.set(!checked())"
    >
      <span class="ui-switch__track"><span class="ui-switch__thumb"></span></span>
      @if (label()) { <span class="ui-switch__label">{{ label() }}</span> }
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ui-switch {
      display: inline-flex; align-items: center; gap: .5rem;
      background: none; border: none; padding: 0; cursor: pointer;
      font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--ink-2);
    }
    .ui-switch:disabled { opacity: .5; cursor: not-allowed; }
    .ui-switch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-sm); }
    .ui-switch__track {
      position: relative; width: 2.25rem; height: 1.25rem; border-radius: 999px;
      background: var(--border-strong); transition: background var(--t);
    }
    .ui-switch__thumb {
      position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 50%;
      background: var(--surface); box-shadow: var(--shadow-2); transition: transform var(--t);
    }
    .ui-switch--on .ui-switch__track { background: var(--accent); }
    .ui-switch--on .ui-switch__thumb { transform: translateX(1rem); }
  `],
})
export class UiSwitchComponent {
  readonly checked = model(false);
  readonly disabled = input(false);
  readonly label = input<string>('');
}
