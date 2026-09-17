import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Estado vacío con motivo y acción. El ícono es opcional (nombre de Material
 * Icons). La acción va en el slot `[actions]`.
 */
@Component({
  selector: 'ui-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-empty">
      @if (icon()) { <span class="material-icons ui-empty__icon" aria-hidden="true">{{ icon() }}</span> }
      <p class="ui-empty__title">{{ title() }}</p>
      @if (description()) { <p class="ui-empty__desc">{{ description() }}</p> }
      <div class="ui-empty__actions"><ng-content select="[actions]" /></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ui-empty {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      gap: .5rem; padding: 3rem var(--pad);
    }
    .ui-empty__icon { font-size: 2.25rem; color: var(--ink-4); }
    .ui-empty__title { margin: 0; font-size: var(--fs-lg); font-weight: 600; color: var(--ink); }
    .ui-empty__desc { margin: 0; max-width: 32rem; font-size: var(--fs-sm); color: var(--ink-3); }
    .ui-empty__actions { margin-top: .5rem; display: inline-flex; gap: .5rem; }
  `],
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
}
