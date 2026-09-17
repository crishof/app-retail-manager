import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Fila de importe: etiqueta a la izquierda, monto en mono/tabular alineado a la
 * derecha. Variante `total` para el renglón final (más peso, borde superior).
 */
@Component({
  selector: 'ui-money-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-money" [class.ui-money--total]="total()">
      <span class="ui-money__label">{{ label() }}</span>
      <span class="ui-money__amount" [attr.data-numeric]="''">{{ prefix() }}{{ amount() }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ui-money {
      display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
      padding: .3125rem 0; font-size: var(--fs-base); color: var(--ink-2);
    }
    .ui-money__amount {
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
      color: var(--ink); text-align: right; white-space: nowrap;
    }
    .ui-money--total {
      margin-top: .25rem; padding-top: .625rem; border-top: 1px solid var(--border-strong);
      font-size: var(--fs-lg);
    }
    .ui-money--total .ui-money__label { font-weight: 600; color: var(--ink); }
    .ui-money--total .ui-money__amount { font-weight: 600; }
  `],
})
export class UiMoneyRowComponent {
  readonly label = input.required<string>();
  readonly amount = input.required<string | number>();
  readonly prefix = input<string>('');
  readonly total = input(false);
}
