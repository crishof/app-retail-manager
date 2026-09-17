import {
  ChangeDetectionStrategy, Component, ElementRef, effect, input, model, viewChild,
} from '@angular/core';

/**
 * Checkbox con estado indeterminado (para el "seleccionar todo" de las tablas).
 * `indeterminate` se refleja en el input nativo vía effect.
 */
@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ui-cbx" [class.ui-cbx--disabled]="disabled()">
      <input
        #box
        type="checkbox"
        class="ui-cbx__input"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || label() || null"
        (change)="onChange($event)"
      />
      <span class="ui-cbx__box" aria-hidden="true"></span>
      @if (label()) { <span class="ui-cbx__label">{{ label() }}</span> }
      <ng-content />
    </label>
  `,
  styles: [`
    .ui-cbx { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; font-size: var(--fs-sm); color: var(--ink-2); }
    .ui-cbx--disabled { opacity: .5; cursor: not-allowed; }
    .ui-cbx__input { position: absolute; opacity: 0; width: 1.05rem; height: 1.05rem; margin: 0; cursor: inherit; }
    .ui-cbx__box {
      width: 1.05rem; height: 1.05rem; border-radius: 5px; border: 1.5px solid var(--border-strong);
      background: var(--surface); display: inline-flex; align-items: center; justify-content: center;
      transition: background var(--t), border-color var(--t); flex: none;
    }
    .ui-cbx__box::after { content: ''; width: .5rem; height: .5rem; transform: scale(0); transition: transform var(--t); }
    .ui-cbx__input:checked + .ui-cbx__box,
    .ui-cbx__input:indeterminate + .ui-cbx__box { background: var(--accent); border-color: var(--accent); }
    .ui-cbx__input:checked + .ui-cbx__box::after {
      transform: scale(1); background: none;
      width: .3rem; height: .55rem; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px,-1px);
    }
    .ui-cbx__input:indeterminate + .ui-cbx__box::after {
      transform: scale(1); width: .55rem; height: 2px; background: #fff; border-radius: 1px;
    }
    .ui-cbx__input:focus-visible + .ui-cbx__box { outline: 2px solid var(--accent); outline-offset: 2px; }
  `],
})
export class UiCheckboxComponent {
  readonly checked = model(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);
  readonly label = input<string>('');
  /** Nombre accesible sin texto visible (para checkbox de sólo control). */
  readonly ariaLabel = input<string>('');

  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');

  constructor() {
    effect(() => {
      const el = this.box()?.nativeElement;
      if (el) el.indeterminate = this.indeterminate();
    });
  }

  protected onChange(e: Event): void {
    this.checked.set((e.target as HTMLInputElement).checked);
  }
}
