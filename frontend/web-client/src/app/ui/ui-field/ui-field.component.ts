import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let uid = 0;

/**
 * Envoltorio de campo de formulario: label + control proyectado + ayuda/error.
 *
 * El consumidor proyecta un <input>/<select>/<textarea> con la clase .ui-control
 * (definida en styles/ui-controls.css), evitando ::ng-deep. Ejemplo:
 *
 *   <ui-field label="Nombre" [error]="form.controls.name.errors ? 'Requerido' : ''">
 *     <input class="ui-control" formControlName="name" [id]="fieldId" />
 *   </ui-field>
 */
@Component({
  selector: 'ui-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-field">
      @if (label()) {
        <label class="ui-label" [attr.for]="for()">
          {{ label() }}@if (required()) { <span class="ui-field__req" aria-hidden="true">*</span> }
        </label>
      }
      <ng-content />
      @if (error()) {
        <p class="ui-field__error" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p class="ui-field__hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [`
    .ui-field { display: block; }
    .ui-field__req { color: var(--stop); margin-left: .125rem; }
    .ui-field__error { margin: .3125rem 0 0; font-size: var(--fs-xs); color: var(--stop); }
    .ui-field__hint  { margin: .3125rem 0 0; font-size: var(--fs-xs); color: var(--ink-3); }
  `],
})
export class UiFieldComponent {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input(false);
  readonly for = input<string>('');

  protected readonly autoId = computed(() => this.for() || `ui-field-${++uid}`);
}
