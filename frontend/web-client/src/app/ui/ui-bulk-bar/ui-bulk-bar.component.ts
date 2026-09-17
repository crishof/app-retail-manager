import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Barra flotante de acciones masivas. Aparece cuando hay selección (`count` > 0).
 * Las acciones van en el slot; expone `clear` para deseleccionar.
 */
@Component({
  selector: 'ui-bulk-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (count() > 0) {
      <div class="ui-bulk" role="region" aria-label="Acciones sobre la selección">
        <div class="ui-bulk__count">
          <span class="ui-bulk__n" [attr.data-numeric]="''">{{ count() }}</span>
          <span>{{ count() === 1 ? 'seleccionado' : 'seleccionados' }}</span>
        </div>
        <div class="ui-bulk__actions"><ng-content /></div>
        <button type="button" class="ui-bulk__clear" (click)="clear.emit()" aria-label="Limpiar selección">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .ui-bulk {
      position: sticky; bottom: 1rem; z-index: 20;
      display: flex; align-items: center; gap: 1rem; margin: 0 auto; width: fit-content; max-width: 100%;
      padding: .5rem .5rem .5rem 1rem;
      background: var(--ink); color: var(--surface);
      border-radius: 999px; box-shadow: 0 6px 20px rgb(0 0 0 / .22);
    }
    .ui-bulk__count { display: inline-flex; align-items: baseline; gap: .375rem; font-size: var(--fs-sm); white-space: nowrap; }
    .ui-bulk__n { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 700; font-size: var(--fs-lg); }
    .ui-bulk__actions { display: inline-flex; align-items: center; gap: .375rem; }
    .ui-bulk__clear {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 50%; border: none; cursor: pointer;
      background: color-mix(in srgb, var(--surface) 15%, transparent); color: var(--surface);
    }
    .ui-bulk__clear:hover { background: color-mix(in srgb, var(--surface) 28%, transparent); }
    .ui-bulk__clear:focus-visible { outline: 2px solid var(--accent-hi); outline-offset: 2px; }
  `],
})
export class UiBulkBarComponent {
  readonly count = input.required<number>();
  readonly clear = output<void>();
}
