import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface UiStep {
  label: string;
  state: 'done' | 'active' | 'todo';
}

/**
 * Secuencia de estados. El paso activo lleva un led de 7px que pulsa por escala
 * y glow (sin aureolas). Horizontal por defecto; vertical opcional.
 */
@Component({
  selector: 'ui-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ui-step" [class.ui-step--vertical]="vertical()">
      @for (s of steps(); track s.label; let last = $last) {
        <li class="ui-step__item" [attr.data-state]="s.state" [attr.aria-current]="s.state === 'active' ? 'step' : null">
          <span class="ui-step__led" aria-hidden="true"></span>
          <span class="ui-step__label">{{ s.label }}</span>
          @if (!last) { <span class="ui-step__bar" aria-hidden="true"></span> }
        </li>
      }
    </ol>
  `,
  styles: [`
    :host { display: block; }
    .ui-step { list-style: none; margin: 0; padding: 0; display: flex; gap: 0; }
    .ui-step--vertical { flex-direction: column; }
    .ui-step__item { display: flex; align-items: center; gap: .5rem; flex: 1; min-width: 0; font-size: var(--fs-sm); color: var(--ink-3); }
    .ui-step--vertical .ui-step__item { flex: none; padding-bottom: .75rem; }
    .ui-step__led { width: 7px; height: 7px; border-radius: 50%; background: var(--border-strong); flex: none; }
    .ui-step__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ui-step__bar { flex: 1; height: 1px; background: var(--border); min-width: 1rem; }

    .ui-step__item[data-state="done"]   { color: var(--ink-2); }
    .ui-step__item[data-state="done"]   .ui-step__led { background: var(--ok); }
    .ui-step__item[data-state="active"] { color: var(--ink); font-weight: 600; }
    .ui-step__item[data-state="active"] .ui-step__led {
      background: var(--led); box-shadow: var(--led-glow);
      animation: ui-led-pulse 1.6s ease-in-out infinite;
    }
    @keyframes ui-led-pulse {
      0%, 100% { transform: scale(1); box-shadow: var(--led-glow); }
      50% { transform: scale(1.35); box-shadow: 0 0 10px var(--led); }
    }
    @media (prefers-reduced-motion: reduce) { .ui-step__item[data-state="active"] .ui-step__led { animation: none; } }
  `],
})
export class UiStepperComponent {
  readonly steps = input.required<UiStep[]>();
  readonly vertical = input(false);
}
