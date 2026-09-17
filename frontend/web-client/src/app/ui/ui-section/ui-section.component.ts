import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque con cabecera en banda y rótulo mono en mayúscula: es lo que hace
 * reconocible la sección antes de leer su contenido. Slot `actions` a la derecha.
 */
@Component({
  selector: 'ui-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ui-section">
      <header class="ui-section__head">
        <span class="ui-section__label">{{ label() }}</span>
        <div class="ui-section__actions"><ng-content select="[actions]" /></div>
      </header>
      <div class="ui-section__body"><ng-content /></div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ui-section { border: 1px solid var(--border); border-radius: var(--r); background: var(--surface); overflow: hidden; }
    .ui-section__head {
      display: flex; align-items: center; justify-content: space-between; gap: .5rem;
      padding: .625rem var(--pad);
      background: var(--surface-2);
      border-bottom: 1px solid var(--border);
    }
    .ui-section__label {
      font-family: var(--font-mono); font-size: var(--fs-xs); font-weight: 600;
      letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3);
    }
    .ui-section__actions { display: inline-flex; gap: .375rem; align-items: center; }
    .ui-section__body { padding: var(--pad); }
  `],
})
export class UiSectionComponent {
  readonly label = input.required<string>();
}
