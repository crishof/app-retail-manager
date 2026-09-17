import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Fila etiqueta/valor que se apila sola cuando no hay ancho (flex-wrap, no media
 * query: el punto de quiebre lo decide el contenedor). El valor va en el slot.
 */
@Component({
  selector: 'ui-detail-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-drow">
      <span class="ui-drow__label">{{ label() }}</span>
      <span class="ui-drow__value" [class.ui-drow__value--mono]="mono()"><ng-content /></span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ui-drow {
      display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem 1rem;
      padding: .5rem 0; border-bottom: 1px solid var(--border-soft);
    }
    .ui-drow__label { flex: 0 0 auto; min-width: 8rem; font-size: var(--fs-sm); color: var(--ink-3); }
    .ui-drow__value { flex: 1 1 12rem; min-width: 0; font-size: var(--fs-base); color: var(--ink); }
    .ui-drow__value--mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  `],
})
export class UiDetailRowComponent {
  readonly label = input.required<string>();
  readonly mono = input(false);
}
