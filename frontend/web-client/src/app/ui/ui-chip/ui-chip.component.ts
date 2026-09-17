import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * Chip de filtro con contador. Toggle accesible vía aria-pressed.
 * El estado activo se resuelve con `active` (two-way, model()).
 */
@Component({
  selector: 'ui-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ui-chip"
      [class.ui-chip--active]="active()"
      [attr.aria-pressed]="active()"
      (click)="active.set(!active())"
    >
      <span class="ui-chip__label"><ng-content /></span>
      @if (count() !== null) {
        <span class="ui-chip__count">{{ count() }}</span>
      }
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ui-chip {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .3125rem .625rem;
      background: var(--surface); color: var(--ink-2);
      border: 1px solid var(--border-strong); border-radius: 999px;
      font-family: var(--font-sans); font-size: var(--fs-sm); font-weight: 600;
      cursor: pointer; transition: background var(--t), border-color var(--t), color var(--t);
    }
    .ui-chip:hover { background: var(--surface-2); }
    .ui-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .ui-chip--active { background: var(--accent-fill); border-color: var(--accent-line); color: var(--accent); }
    .ui-chip__count {
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
      font-size: var(--fs-xs); padding: 0 .375rem; border-radius: 999px;
      background: var(--surface-2); color: var(--ink-3); min-width: 1.25rem; text-align: center;
    }
    .ui-chip--active .ui-chip__count { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
  `],
})
export class UiChipComponent {
  readonly count = input<number | null>(null);
  readonly active = model(false);
}
