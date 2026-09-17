import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Superficie blanca con padding --pad. De su padding derivan sangrías y bandas
 * (los hijos que quieran banda a todo el ancho usan margen negativo de --pad).
 */
@Component({
  selector: 'ui-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ui-sheet" [class.ui-sheet--flush]="flush()"><ng-content /></div>`,
  styles: [`
    :host { display: block; }
    .ui-sheet {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: var(--pad);
      box-shadow: var(--shadow-1);
    }
    .ui-sheet--flush { padding: 0; overflow: hidden; }
  `],
})
export class UiSheetComponent {
  /** Sin padding: para hojas que contienen una tabla a sangre. */
  readonly flush = input(false);
}
