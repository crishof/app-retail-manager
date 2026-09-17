import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque de carga (shimmer sutil). `rows` para columnas de líneas; `variant`
 * text|block|circle. Respeta prefers-reduced-motion (shimmer se detiene).
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows() > 1) {
      <div class="ui-skel__stack" [attr.aria-hidden]="true">
        @for (r of lines(); track $index) {
          <span class="ui-skel ui-skel--text" [style.width]="r"></span>
        }
      </div>
    } @else {
      <span class="ui-skel" [class.ui-skel--text]="variant()==='text'"
            [class.ui-skel--circle]="variant()==='circle'"
            [style.width]="width()" [style.height]="height()" [attr.aria-hidden]="true"></span>
    }
  `,
  styles: [`
    :host { display: block; }
    .ui-skel {
      display: block; border-radius: var(--r-sm);
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--sunken) 37%, var(--surface-2) 63%);
      background-size: 400% 100%;
      animation: ui-skel-sh 1.4s ease infinite;
    }
    .ui-skel--text { height: .75rem; margin: .25rem 0; }
    .ui-skel--circle { border-radius: 50%; }
    .ui-skel__stack { display: flex; flex-direction: column; }
    @keyframes ui-skel-sh { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
    @media (prefers-reduced-motion: reduce) { .ui-skel { animation: none; } }
  `],
})
export class UiSkeletonComponent {
  readonly variant = input<'text' | 'block' | 'circle'>('block');
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly rows = input<number>(1);

  protected lines(): string[] {
    const n = Math.max(1, this.rows());
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? '60%' : '100%'));
  }
}
