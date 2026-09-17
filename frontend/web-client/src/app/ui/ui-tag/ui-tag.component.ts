import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiTagTone = 'neutral' | 'ok' | 'attn' | 'stop' | 'accent';

/**
 * Etiqueta de estado: punto de color + texto sobre contenedor NEUTRO.
 * El estado se comunica con el punto, nunca con un relleno saturado.
 */
@Component({
  selector: 'ui-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-tag" [attr.data-tone]="tone()">
      <span class="ui-tag__dot" aria-hidden="true"></span>
      <ng-content />
    </span>
  `,
  styles: [`
    .ui-tag {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .1875rem .5rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      font-size: var(--fs-xs); font-weight: 600; color: var(--ink-2);
      white-space: nowrap;
    }
    .ui-tag__dot { width: .5rem; height: .5rem; border-radius: 50%; background: var(--ink-4); flex: none; }
    .ui-tag[data-tone="ok"]     .ui-tag__dot { background: var(--ok); }
    .ui-tag[data-tone="attn"]   .ui-tag__dot { background: var(--attn); }
    .ui-tag[data-tone="stop"]   .ui-tag__dot { background: var(--stop); }
    .ui-tag[data-tone="accent"] .ui-tag__dot { background: var(--accent); }
  `],
})
export class UiTagComponent {
  readonly tone = input<UiTagTone>('neutral');
}
