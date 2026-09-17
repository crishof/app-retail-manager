import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiNoteTone = 'info' | 'ok' | 'attn' | 'stop';

/**
 * Aviso PERSISTENTE con borde hairline y barra de 2px del color del estado,
 * nunca como bloque de alarma. Un aviso que va a estar seis meses en pantalla
 * no puede estar pintado como una emergencia. Slot `actions` opcional.
 */
@Component({
  selector: 'ui-note',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-note" [attr.data-tone]="tone()" role="note">
      <div class="ui-note__body">
        @if (title()) { <p class="ui-note__title">{{ title() }}</p> }
        <div class="ui-note__text"><ng-content /></div>
      </div>
      <div class="ui-note__actions"><ng-content select="[actions]" /></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ui-note {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
      padding: .625rem .875rem .625rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 2px solid var(--ink-4);
      border-radius: var(--r-sm);
      font-size: var(--fs-sm); color: var(--ink-2);
    }
    .ui-note[data-tone="info"] { border-left-color: var(--accent); }
    .ui-note[data-tone="ok"]   { border-left-color: var(--ok); }
    .ui-note[data-tone="attn"] { border-left-color: var(--attn); }
    .ui-note[data-tone="stop"] { border-left-color: var(--stop); }
    .ui-note__title { margin: 0 0 .125rem; font-weight: 600; color: var(--ink); }
    .ui-note__text { margin: 0; }
    .ui-note__actions { display: inline-flex; gap: .375rem; align-items: center; flex: none; }
  `],
})
export class UiNoteComponent {
  readonly tone = input<UiNoteTone>('info');
  readonly title = input<string>('');
}
